import shortUUID from 'short-uuid';
import { Configs } from './Configs';
import { fromGroupInitConfigs, toGroupConfigs } from './Converters';
import { eventEmitter } from './EventEmitter';
import { Choice, Group, Question } from './FormObjects';
import { InitConfigs } from './InitConfigs';
import { ChoiceRenderInstruction, GroupRenderInstruction, QuestionRenderInstruction, RenderInstructions } from './RenderInstructions';
import { Answers, ChoiceValue, Errors, FormRefreshedHook, Validator } from './Types';

export class Form {

  private formId: string;
  private formRefreshedHook?: FormRefreshedHook;
  private validators: Record<string, Validator>;
  private groups: Group[];
  private groupMap = new Map<string, Group>();
  private questionMap = new Map<string, Question>();
  private choiceMap = new Map<string, Choice>();
  private groupParentGroupMap = new Map<string, Group>();
  private questionGroupMap = new Map<string, Group>();
  private choiceQuestionMap = new Map<string, Question>();
  private choiceSelectedMap = new Map<string, boolean>();
  private questionUnvalidatedAnswerMap = new Map<string, any>();
  private questionValidatedAnswerMap = new Map<string, any>();
  private questionErrorMap = new Map<string, string>();

  private constructor(groups: Group[], validators: Record<string, Validator>, formRefreshedHook?: FormRefreshedHook) {
    this.formId = shortUUID.generate();
    this.groups = groups;
    this.validators = validators;
    this.formRefreshedHook = formRefreshedHook;
    this.constructGroupMap(undefined, this.groups);
  }

  private constructGroupMap(parentGroup: Group | undefined, groups: Group[]) {
    groups.forEach(group => {
      this.groupMap.set(group.id!, group);
      this.constructGroupMap(group, group.groups || []);
      this.constructQuestionMap(group, group.questions || []);
      if (parentGroup) {
        this.groupParentGroupMap.set(group.id!, parentGroup);
      }
    });
  }

  private constructQuestionMap(group: Group, questions: Question[]) {
    questions.forEach(question => {
      this.questionMap.set(question.id!, question);
      this.questionGroupMap.set(question.id!, group);
      if (question.type !== 'input') {
        this.constructChoiceMap(question, question.choices);
      }
    });
  }

  private constructChoiceMap(question: Question, choices: Choice[]) {
    choices.forEach(choice => {
      this.choiceMap.set(choice.id!, choice);
      this.choiceQuestionMap.set(choice.id!, question);
    });
  }

  /**
   * Initiate a form with a config.
   *
   * @param configs configs
   * @param validators validators, object keys are validator name, values are validation functions
   * @param formRefreshedHook function to be invoked when form is refreshed
   * @returns form object
   */
  static fromConfigs(configs: InitConfigs, validators?: Record<string, Validator>, formRefreshedHook?: FormRefreshedHook) {
    const groups = fromGroupInitConfigs(undefined, configs);
    return new Form(groups, validators || {}, formRefreshedHook);
  }

  /**
   * Get a set of instructions to be used for rendering frontend UI.
   *
   * @returns render instructions
   */
  getRenderInstructions(): RenderInstructions {
    return this.toGroupRenderInstruction(this.groups);
  }

  private toGroupRenderInstruction(groups: Group[]): GroupRenderInstruction[] {
    return groups.map((group): GroupRenderInstruction => ({
      id: group.id,
      disabled: this.isGroupDisabled(group),
      ui: group.ui,
      groups: this.toGroupRenderInstruction(group.groups),
      questions: this.toQuestionRenderInstruction(group.questions)
    }));
  }

  private toQuestionRenderInstruction(questions: Question[]): QuestionRenderInstruction[] {
    return questions.map((question): QuestionRenderInstruction => ({
      id: question.id,
      disabled: this.isQuestionDisabled(question),
      ui: question.ui,
      type: question.type,
      choices: question.type !== 'input' ? this.toChoiceRenderInstruction(question.choices) : [],
      unvalidatedAnswer: this.questionUnvalidatedAnswerMap.get(question.id),
      validatedAnswer: this.isQuestionDisabled(question) ? undefined : this.questionValidatedAnswerMap.get(question.id),
      error: this.questionErrorMap.get(question.id)
    }));
  }

  private toChoiceRenderInstruction(choices: Choice[]): ChoiceRenderInstruction[] {
    return choices.map((choice): ChoiceRenderInstruction => ({
      id: choice.id,
      disabled: this.isChoiceDisabled(choice),
      ui: choice.ui,
      value: choice.value,
      selected: !!this.choiceSelectedMap.get(choice.id)
    }));
  }

  private findGroup(groupId: string) {
    const group = this.groupMap.get(groupId);
    if (!group) {
      throw new Error('Group is not found.');
    }
    return group;
  }

  private findQuestion(questionId: string) {
    const question = this.questionMap.get(questionId);
    if (!question) {
      throw new Error('Question is not found.');
    }
    return question;
  }

  private findChoice(choiceId: string) {
    const choice = this.choiceMap.get(choiceId);
    if (!choice) {
      throw new Error('Choice is not found.');
    }
    return choice;
  }

  /**
   * Clear answers of the entire form.
   */
  clear() {
    for (const group of this.groups) {
      this.internalClearGroup(group);
    }

    this.refreshForm();
  }

  /**
   * Clear answers of the entire form asynchronously.
   * Use this if any of the validations is asynchronous.
   */
  async clearAsync() {
    for (const group of this.groups) {
      await this.internalClearGroupAsync(group);
    }

    this.refreshForm();
  }

  /**
   * Clear answers of the entire group.
   *
   * @param groupId group id
   */
  clearGroup(groupId: string) {
    const group = this.findGroup(groupId);
    this.internalClearGroup(group);

    this.refreshForm();
  }

  /**
   * Clear answers of the entire group asynchronously.
   * Use this if any of the validations is asynchronous.
   *
   * @param groupId group id
   */
  async clearGroupAsync(groupId: string) {
    const group = this.findGroup(groupId);
    await this.internalClearGroupAsync(group);

    this.refreshForm();
  }

  /**
   * Clear answer of a question.
   *
   * @param questionId question id
   */
  clearAnswer(questionId: string) {
    const question = this.findQuestion(questionId);
    this.internalClearAnswer(question);

    this.refreshForm();
  }

  /**
   * Clear answer of a question asynchronously.
   * Use this if validation of the question is asynchronous.
   *
   * @param questionId question id
   */
  async clearAnswerAsync(questionId: string) {
    const question = this.findQuestion(questionId);
    await this.internalClearAnswerAsync(question);

    this.refreshForm();
  }

  private internalClearGroup(group: Group) {
    for (const subGroup of group.groups) {
      this.internalClearGroup(subGroup);
    }
    for (const question of group.questions) {
      this.internalClearAnswer(question);
    }
  }

  private async internalClearGroupAsync(group: Group) {
    for (const subGroup of group.groups) {
      await this.internalClearGroupAsync(subGroup);
    }
    for (const question of group.questions) {
      await this.internalClearAnswerAsync(question);
    }
  }

  private internalClearAnswer(question: Question) {
    if (question.type === 'input') {
      this.setInput(question.id, undefined);
    } else if (question.type === 'single') {
      this.setChoice(question.id, undefined as any);
    } else if (question.type === 'multiple') {
      this.setChoices(question.id, []);
    }
  }

  private async internalClearAnswerAsync(question: Question) {
    if (question.type === 'input') {
      await this.setInputAsync(question.id, undefined);
    } else if (question.type === 'single') {
      await this.setChoiceAsync(question.id, undefined as any);
    } else if (question.type === 'multiple') {
      await this.setChoicesAsync(question.id, []);
    }
  }

  /**
   * Set value of the question with `input` as type.
   *
   * @param questionId question id
   * @param value value
   */
  setInput(questionId: string, value: any) {
    const question = this.findQuestion(questionId);

    try {
      this.questionUnvalidatedAnswerMap.set(questionId, value);
      this.validateQuestion(question, value);
      this.questionValidatedAnswerMap.set(questionId, value);
      this.questionErrorMap.delete(questionId);
    } catch (err) {
      this.questionValidatedAnswerMap.delete(questionId);
      this.questionErrorMap.set(questionId, err.message);
    }

    this.refreshForm();
  }

  /**
   * Set value of the question with `input` as type asynchronously.
   * Use this if validation of the question is asynchronous.
   *
   * @param questionId question id
   * @param value value
   */
  async setInputAsync(questionId: string, value: any) {
    const question = this.findQuestion(questionId);

    try {
      this.questionUnvalidatedAnswerMap.set(questionId, value);
      await this.validateQuestionAsync(question, value);
      this.questionValidatedAnswerMap.set(questionId, value);
      this.questionErrorMap.delete(questionId);
    } catch (err) {
      this.questionValidatedAnswerMap.delete(questionId);
      this.questionErrorMap.set(questionId, err.message);
    }

    this.refreshForm();
  }

  /**
   * Mark a choice as selected/unselected.
   *
   * @param choiceId choice id
   * @param selected selected/unselected
   */
  selectChoice(choiceId: string, selected: boolean) {
    const question = this.choiceQuestionMap.get(choiceId)!;
    this.internalSelectChoice(question, choiceId, selected, true);

    this.refreshForm();
  }

  /**
   * Mark a choice as selected/unselected asynchronously.
   * Use this if validation of the question is asynchronous.
   *
   * @param choiceId choice id
   * @param selected selected/unselected
   */
  async selectChoiceAsync(choiceId: string, selected: boolean) {
    const question = this.choiceQuestionMap.get(choiceId)!;
    await this.internalSelectChoiceAsync(question, choiceId, selected, true);

    this.refreshForm();
  }

  /**
   * Set value of the question with `single` as type.
   *
   * @param questionId question id
   * @param value choice's value
   */
  setChoice(questionId: string, value: ChoiceValue) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i];
      this.internalSelectChoice(question, choice.id, choice.value === value, i === question.choices.length - 1);
    }

    this.refreshForm();
  }

  /**
   * Set value of the question with `single` as type asynchronously.
   * Use this if validation of the question is asynchronous.
   *
   * @param questionId question id
   * @param value choice's value
   */
  async setChoiceAsync(questionId: string, value: ChoiceValue) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i];
      await this.internalSelectChoiceAsync(question, choice.id, choice.value === value, i === question.choices.length - 1);
    }

    this.refreshForm();
  }

  /**
   * Set values of the question with `multiple` as type.
   *
   * @param questionId question id
   * @param values choices' values
   */
  setChoices(questionId: string, values: ChoiceValue[]) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i];
      this.internalSelectChoice(question, choice.id, values.includes(choice.value), i === question.choices.length - 1);
    }

    this.refreshForm();
  }

  /**
   * Set values of the question with `multiple` as type asynchronously.
   * Use this if validation of the question is asynchronous.
   *
   * @param questionId question id
   * @param values choices' values
   */
  async setChoicesAsync(questionId: string, values: ChoiceValue[]) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices.length; i++) {
      const choice = question.choices[i];
      await this.internalSelectChoiceAsync(question, choice.id, values.includes(choice.value), i === question.choices.length - 1);
    }

    this.refreshForm();
  }

  private internalSelectChoice(question: Question, choiceId: string, selected: boolean, validate: boolean) {
    const choice = this.findChoice(choiceId);

    if (question.type === 'single' && selected) {
      question.choices.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    this.handleChoiceOnSelected(choice, selected);

    if (!validate) {
      return;
    }

    try {
      const answer = this.getQuestionValue(question);
      this.questionUnvalidatedAnswerMap.set(question.id, answer);
      this.validateQuestion(question, answer);
      this.questionValidatedAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionValidatedAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }
  }

  private async internalSelectChoiceAsync(question: Question, choiceId: string, selected: boolean, validate: boolean) {
    const choice = this.findChoice(choiceId);

    if (question.type === 'single' && selected) {
      question.choices.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    this.handleChoiceOnSelected(choice, selected);

    if (!validate) {
      return;
    }

    try {
      const answer = this.getQuestionValue(question);
      this.questionUnvalidatedAnswerMap.set(question.id, answer);
      await this.validateQuestionAsync(question, answer);
      this.questionValidatedAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionValidatedAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }
  }

  private handleChoiceOnSelected(choice: Choice, selected: boolean) {
    let disablings = choice.onSelected.disable || [];
    let enablings = choice.onSelected.enable || [];
    if (!selected) {
      enablings = choice.onSelected.disable || [];
      disablings = choice.onSelected.enable || [];
    }

    disablings.forEach(id => {
      const group = this.groupMap.get(id);
      const question = this.questionMap.get(id);
      const choice = this.choiceMap.get(id);
      if (group) {
        group.disabled = true;
      }
      if (question) {
        this.setQuestionDisabled(question, true);
      }
      if (choice) {
        this.setChoiceDisabled(choice, true);
      }
    });

    enablings.forEach(id => {
      const group = this.groupMap.get(id);
      const question = this.questionMap.get(id);
      const choice = this.choiceMap.get(id);
      if (group) {
        group.disabled = false;
      }
      if (question) {
        this.setQuestionDisabled(question, false);
      }
      if (choice) {
        this.setChoiceDisabled(choice, false);
      }
    });
  }

  private setGroupDisabled(group: Group, disabled: boolean) {
    group.disabled = disabled;
    group.groups.forEach(subGroup => this.setGroupDisabled(subGroup, disabled));
    group.questions.forEach(question => this.setQuestionDisabled(question, disabled));
  }

  private setQuestionDisabled(question: Question, disabled: boolean) {
    question.disabled = disabled;
    question.choices.forEach(choice => this.setChoiceDisabled(choice, disabled));
  }

  private setChoiceDisabled(choice: Choice, disabled: boolean) {
    choice.disabled = disabled;
    let selected: boolean;
    if (disabled) {
      selected = false;
    } else {
      selected = !!this.choiceSelectedMap.get(choice.id);
    }
    this.handleChoiceOnSelected(choice, selected);
  }

  private getQuestionValue(question: Question) {
    if (question.type === 'input') {
      return this.questionUnvalidatedAnswerMap.get(question.id)!;
    }

    if (question.type === 'single') {
      return question.choices.find(choice => !choice.disabled && this.choiceSelectedMap.get(choice.id))?.value;
    }

    if (question.type === 'multiple') {
      return question.choices.filter(choice => !choice.disabled && this.choiceSelectedMap.get(choice.id)).map(choice => choice.value);
    }
  }

  private validateQuestion(question: Question, value: any) {
    if (!question.validator) {
      return;
    }
    const validator = this.validators[question.validator];
    if (!validator) {
      return;
    }
    validator(value, question.validation || {});
  }

  private async validateQuestionAsync(question: Question, value: any) {
    if (!question.validator) {
      return;
    }
    const validator = this.validators[question.validator];
    if (!validator) {
      return;
    }
    await validator(value, question.validation || {});
  }

  private isGroupDisabled(group: Group): boolean {
    if (group.disabled) {
      return true;
    }
    const parentGroup = this.groupParentGroupMap.get(group.id);
    if (parentGroup) {
      return this.isGroupDisabled(parentGroup);
    }
    return false;
  }

  private isQuestionDisabled(question: Question) {
    if (question.disabled) {
      return true;
    }
    const group = this.questionGroupMap.get(question.id)!;
    return this.isGroupDisabled(group);
  }

  private isChoiceDisabled(choice: Choice) {
    if (choice.disabled) {
      return true;
    }
    const question = this.choiceQuestionMap.get(choice.id)!;
    return this.isQuestionDisabled(question);
  }

  /**
   * Get sanitized configs of this form.
   * You can persist it and use it with `fromConfigs` method to reinitiate the form later.
   *
   * @returns configs
   */
  getConfigs(): Configs {
    return toGroupConfigs(this.groups);
  }

  /**
   * Import answers to the form.
   *
   * @param answers answers
   */
  importAnswers(answers: Answers) {
    this.internalImportAnswers(answers, false);
  }

  /**
   * Import answers to the form asynchronously.
   * Use this if any of the validations is asynchronous.
   *
   * @param answers answers
   */
  async importAnswersAsync(answers: Answers) {
    await this.internalImportAnswersAsync(answers, false);
  }

  private internalImportAnswers(answers: Answers, retainCurrentValue: boolean) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      let answer = answers[questionId];

      if (answer === undefined && retainCurrentValue) {
        answer = this.getQuestionValue(question);
      }

      if (question.type === 'input') {
        this.setInput(questionId, answer);
      } else if (question.type === 'single') {
        this.setChoice(questionId, answer);
      } else if (question.type === 'multiple') {
        this.setChoices(questionId, answer || []);
      }
    }
  }

  private async internalImportAnswersAsync(answers: Answers, retainCurrentValue: boolean) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      let answer = answers[questionId];

      if (answer === undefined && retainCurrentValue) {
        answer = this.getQuestionValue(question);
      }

      if (question.type === 'input') {
        await this.setInputAsync(questionId, answer);
      } else if (question.type === 'single') {
        await this.setChoiceAsync(questionId, answer);
      } else if (question.type === 'multiple') {
        await this.setChoicesAsync(questionId, answer || []);
      }
    }
  }

  /**
   * Get unvalidated answers.
   * You can persist it and use it with `importAnswers` method to restore the answers later.
   *
   * @returns unvalidated answers, object keys are question ids, values are answers
   */
  getUnvalidatedAnswers(): Answers {
    const answes: Answers = {};

    for (const entry of this.questionMap.entries()) {
      const [questionId] = entry;
      const answer = this.questionUnvalidatedAnswerMap.get(questionId);
      if (answer !== undefined) {
        answes[questionId] = answer;
      }
    }

    return answes;
  }

  /**
   * Get validated answers.
   * If a question is disabled or it's answer is not valid, it's answer will be set to `undefined`.
   * You can persist it and use it with `importAnswers` method to restore the answers later.
   *
   * @returns validated answers, object keys are question ids, values are answers
   */
  getValidatedAnswers(): Answers {
    const answes: Answers = {};

    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      if (!this.isQuestionDisabled(question)) {
        const answer = this.questionValidatedAnswerMap.get(questionId);
        if (answer !== undefined) {
          answes[questionId] = answer;
        }
      }
    }

    return answes;
  }

  /**
   * Get error messages.
   *
   * Questions which didn't go through validation will not have error messages, even if their answers are currently invalid.
   * You can use `validate` method to validate all answers in the form.
   *
   * @returns errors, object keys are question ids, values are error message
   */
  getErrors(): Errors {
    const errors: Errors = {};

    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      if (!this.isQuestionDisabled(question)) {
        const error = this.questionErrorMap.get(questionId);
        if (error !== undefined) {
          errors[questionId] = error;
        }
      }
    }

    return errors;
  }

  /**
   * Validate the entire form.
   *
   * @returns whether form is clean
   */
  validate() {
    const answers = this.getValidatedAnswers();
    this.internalImportAnswers(answers, true);
    return this.isClean();
  }

  /**
   * Validate the entire form asynchronously.
   * Use this if any of the validations is asynchronous.
   *
   * @returns whether form is clean
   */
  async validateAsync() {
    const answers = this.getValidatedAnswers();
    await this.internalImportAnswersAsync(answers, true);
    return this.isClean();
  }

  /**
   * Check whether form is clean.
   *
   * Form will always be clean if it didn't go through any validation, even if there are invalid answers in the form.
   * You can use `validate` method to validate all answers in the form.
   *
   * @returns whether form is clean
   */
  isClean() {
    for (const entry of this.questionErrorMap.entries()) {
      const [questionId, error] = entry;
      const question = this.findQuestion(questionId);
      if (this.isQuestionDisabled(question)) {
        continue;
      }
      if (error) {
        return false;
      }
    }
    return true;
  }

  private getFormId() {
    return this.formId;
  }

  private refreshForm() {
    eventEmitter.emit(this.formId);

    if (this.formRefreshedHook) {
      this.formRefreshedHook();
    }
  }

}
