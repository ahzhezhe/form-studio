import shortUUID from 'short-uuid';
import { Configs } from './Configs';
import { fromGroupInitConfigs, toGroupConfigs } from './Converters';
import { eventEmitter } from './EventEmitter';
import { Choice, Group, Question } from './FormEngineObjects';
import { InitConfigs } from './InitConfigs';
import { ChoiceRenderInstruction, GroupRenderInstruction, QuestionRenderInstruction, RenderInstructions } from './RenderInstructions';
import { Answers, ChoiceValue, Errors, FormRefreshedHook, Validator } from './Types';

export class FormEngine {

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
        this.constructChoiceMap(question, question.choices!);
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
   * Initiate a form engine with a config.
   *
   * @param config config
   * @param validators validators
   * @param formRefreshedHook function to be invoked when form is refreshed
   * @returns form engine
   */
  static fromConfigs(config: InitConfigs, validators?: Record<string, Validator>, formRefreshedHook?: FormRefreshedHook) {
    const groups = fromGroupInitConfigs(undefined, config);
    return new FormEngine(groups, validators || {}, formRefreshedHook);
  }

  /**
   * Get a set of instructions to be used to render frontend UI.
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
      uiConfig: group.uiConfig,
      groups: this.toGroupRenderInstruction(group.groups),
      questions: this.toQuestionRenderInstruction(group.questions)
    }));
  }

  private toQuestionRenderInstruction(questions: Question[]): QuestionRenderInstruction[] {
    return questions.map((question): QuestionRenderInstruction => ({
      id: question.id,
      disabled: this.isQuestionDisabled(question),
      uiConfig: question.uiConfig,
      type: question.type,
      choices: question.type !== 'input' ? this.toChoiceRenderInstruction(question.choices!) : undefined,
      unvalidatedAnswer: this.questionUnvalidatedAnswerMap.get(question.id),
      validatedAnswer: this.isQuestionDisabled(question) ? undefined : this.questionValidatedAnswerMap.get(question.id),
      error: this.questionErrorMap.get(question.id)
    }));
  }

  private toChoiceRenderInstruction(choices: Choice[]): ChoiceRenderInstruction[] {
    return choices.map((choice): ChoiceRenderInstruction => ({
      id: choice.id,
      disabled: this.isChoiceDisabled(choice),
      uiConfig: choice.uiConfig,
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

  clear() {
    for (const group of this.groups) {
      this.internalClearGroup(group);
    }

    this.refreshForm();
  }

  async clearPromise() {
    for (const group of this.groups) {
      await this.internalClearGroupPromise(group);
    }

    this.refreshForm();
  }

  clearGroup(groupId: string) {
    const group = this.findGroup(groupId);
    this.internalClearGroup(group);

    this.refreshForm();
  }

  async clearGroupPromise(groupId: string) {
    const group = this.findGroup(groupId);
    await this.internalClearGroupPromise(group);

    this.refreshForm();
  }

  clearAnswer(questionId: string) {
    const question = this.findQuestion(questionId);
    this.internalClearAnswer(question);

    this.refreshForm();
  }

  async clearAnswerPromise(questionId: string) {
    const question = this.findQuestion(questionId);
    await this.internalClearAnswerPromise(question);

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

  private async internalClearGroupPromise(group: Group) {
    for (const subGroup of group.groups) {
      await this.internalClearGroupPromise(subGroup);
    }
    for (const question of group.questions) {
      await this.internalClearAnswerPromise(question);
    }
  }

  private internalClearAnswer(question: Question) {
    if (question.type === 'input') {
      this.setInputValue(question.id, undefined);
    } else if (question.type === 'single') {
      this.setChoice(question.id, undefined as any);
    } else if (question.type === 'multiple') {
      this.setChoices(question.id, []);
    }
  }

  private async internalClearAnswerPromise(question: Question) {
    if (question.type === 'input') {
      await this.setInputValuePromise(question.id, undefined);
    } else if (question.type === 'single') {
      await this.setChoicePromise(question.id, undefined as any);
    } else if (question.type === 'multiple') {
      await this.setChoicesPromise(question.id, []);
    }
  }

  setInputValue(questionId: string, value: any) {
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

  async setInputValuePromise(questionId: string, value: any) {
    const question = this.findQuestion(questionId);

    try {
      this.questionUnvalidatedAnswerMap.set(questionId, value);
      await this.validateQuestionPromise(question, value);
      this.questionValidatedAnswerMap.set(questionId, value);
      this.questionErrorMap.delete(questionId);
    } catch (err) {
      this.questionValidatedAnswerMap.delete(questionId);
      this.questionErrorMap.set(questionId, err.message);
    }

    this.refreshForm();
  }

  selectChoice(choiceId: string, selected: boolean) {
    const question = this.choiceQuestionMap.get(choiceId)!;
    this.internalSelectChoice(question, choiceId, selected, true);

    this.refreshForm();
  }

  async selectChoicePromise(choiceId: string, selected: boolean) {
    const question = this.choiceQuestionMap.get(choiceId)!;
    await this.internalSelectChoicePromise(question, choiceId, selected, true);

    this.refreshForm();
  }

  setChoice(questionId: string, value: ChoiceValue) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      this.internalSelectChoice(question, choice.id, choice.value === value, i === question.choices!.length - 1);
    }

    this.refreshForm();
  }

  async setChoicePromise(questionId: string, value: ChoiceValue) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      await this.internalSelectChoicePromise(question, choice.id, choice.value === value, i === question.choices!.length - 1);
    }

    this.refreshForm();
  }

  setChoices(questionId: string, values: ChoiceValue[]) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      this.internalSelectChoice(question, choice.id, values.includes(choice.value), i === question.choices!.length - 1);
    }

    this.refreshForm();
  }

  async setChoicesPromise(questionId: string, values: ChoiceValue[]) {
    const question = this.findQuestion(questionId);

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      await this.internalSelectChoicePromise(question, choice.id, values.includes(choice.value), i === question.choices!.length - 1);
    }

    this.refreshForm();
  }

  private internalSelectChoice(question: Question, choiceId: string, selected: boolean, validate: boolean) {
    const choice = this.findChoice(choiceId);

    if (question.type === 'single' && selected) {
      question.choices!.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
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

  private async internalSelectChoicePromise(question: Question, choiceId: string, selected: boolean, validate: boolean) {
    const choice = this.findChoice(choiceId);

    if (question.type === 'single' && selected) {
      question.choices!.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    this.handleChoiceOnSelected(choice, selected);

    if (!validate) {
      return;
    }

    try {
      const answer = this.getQuestionValue(question);
      this.questionUnvalidatedAnswerMap.set(question.id, answer);
      await this.validateQuestionPromise(question, answer);
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
    group.groups?.forEach(subGroup => this.setGroupDisabled(subGroup, disabled));
    group.questions?.forEach(question => this.setQuestionDisabled(question, disabled));
  }

  private setQuestionDisabled(question: Question, disabled: boolean) {
    question.disabled = disabled;
    question.choices?.forEach(choice => this.setChoiceDisabled(choice, disabled));
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
      return question.choices!.find(choice => !choice.disabled && this.choiceSelectedMap.get(choice.id))?.value;
    }

    if (question.type === 'multiple') {
      return question.choices!.filter(choice => !choice.disabled && this.choiceSelectedMap.get(choice.id)).map(choice => choice.value);
    }
  }

  private validateQuestion(question: Question, value: any) {
    if (!question.validatorKey) {
      return;
    }
    const validator = this.validators[question.validatorKey];
    if (!validator) {
      return;
    }
    validator(value, question.validationConfig || {});
  }

  private async validateQuestionPromise(question: Question, value: any) {
    if (!question.validatorKey) {
      return;
    }
    const validator = this.validators[question.validatorKey];
    if (!validator) {
      return;
    }
    await validator(value, question.validationConfig || {});
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

  getConfigs(): Configs {
    return toGroupConfigs(this.groups);
  }

  importAnswers(answers: Answers) {
    this.internalImportAnswers(answers, false);
  }

  async importAnswersPromise(answers: Answers) {
    await this.internalImportAnswersPromise(answers, false);
  }

  private internalImportAnswers(answers: Answers, retainCurrentValue: boolean) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      let answer = answers[questionId];

      if (answer === undefined && retainCurrentValue) {
        answer = this.getQuestionValue(question);
      }

      if (question.type === 'input') {
        this.setInputValue(questionId, answer);
      } else if (question.type === 'single') {
        this.setChoice(questionId, answer);
      } else if (question.type === 'multiple') {
        this.setChoices(questionId, answer || []);
      }
    }
  }

  private async internalImportAnswersPromise(answers: Answers, retainCurrentValue: boolean) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      let answer = answers[questionId];

      if (answer === undefined && retainCurrentValue) {
        answer = this.getQuestionValue(question);
      }

      if (question.type === 'input') {
        await this.setInputValuePromise(questionId, answer);
      } else if (question.type === 'single') {
        await this.setChoicePromise(questionId, answer);
      } else if (question.type === 'multiple') {
        await this.setChoicesPromise(questionId, answer || []);
      }
    }
  }

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

  validate() {
    const answers = this.getValidatedAnswers();
    this.internalImportAnswers(answers, true);
    return this.isClean();
  }

  async validatePromise() {
    const answers = this.getValidatedAnswers();
    await this.internalImportAnswersPromise(answers, true);
    return this.isClean();
  }

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
