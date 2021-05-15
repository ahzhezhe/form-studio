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
  private lastRenderInstructions?: RenderInstructions;
  private groups: Group[];
  private groupMap = new Map<string, Group>();
  private questionMap = new Map<string, Question>();
  private choiceMap = new Map<string, Choice>();
  private groupParentGroupMap = new Map<string, Group>();
  private questionGroupMap = new Map<string, Group>();
  private choiceQuestionMap = new Map<string, Question>();
  private questionUnvalidatedAnswerMap = new Map<string, any>();
  private questionValidatedAnswerMap = new Map<string, any>();
  private questionValidatingMap = new Map<string, boolean>();
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

  private getFormId() {
    return this.formId;
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
   * Get sanitized configs of this form.
   * You can persist it and use it with `fromConfigs` method to reinitiate the form later.
   *
   * @returns configs
   */
  getConfigs(): Configs {
    return toGroupConfigs(this.groups);
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
      validating: !!this.questionValidatingMap.get(question.id),
      error: this.questionErrorMap.get(question.id)
    }));
  }

  private toChoiceRenderInstruction(choices: Choice[]): ChoiceRenderInstruction[] {
    return choices.map((choice): ChoiceRenderInstruction => ({
      id: choice.id,
      disabled: this.isChoiceDisabled(choice),
      ui: choice.ui,
      value: choice.value
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

  /**
   * Clear answers of the entire form.
   */
  clear() {
    for (const group of this.groups) {
      this.clearGroup(group.id);
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

    for (const subGroup of group.groups) {
      this.clearGroup(subGroup.id);
    }
    for (const question of group.questions) {
      this.clearAnswer(question.id);
    }

    this.refreshForm();
  }

  /**
   * Clear answer of a question.
   *
   * @param questionId question id
   */
  clearAnswer(questionId: string) {
    const question = this.findQuestion(questionId);

    if (question.type === 'input') {
      this.setInput(question.id, undefined);
    } else if (question.type === 'single') {
      this.setChoice(question.id, undefined as any);
    } else if (question.type === 'multiple') {
      this.setChoices(question.id, []);
    }

    this.refreshForm();
  }

  private setUnvalidatedAnswerAndValidate(question: Question, answer: any) {
    this.questionUnvalidatedAnswerMap.set(question.id, answer);

    if (!question.validator) {
      return;
    }

    const validator = this.validators[question.validator];
    if (!validator) {
      return;
    }

    const onSuccess = () => {
      this.questionValidatedAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    };

    const onError = (err: any) => {
      this.questionValidatedAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    };

    let validationResult: void | Promise<void>;
    try {
      validationResult = validator(answer, question.validation || {});
    } catch (err) {
      onError(err);
      this.refreshForm();
      return;
    }

    if (validationResult instanceof Promise) {
      this.questionValidatingMap.set(question.id, true);
      this.refreshForm();

      validationResult
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          this.questionValidatingMap.delete(question.id);
          this.refreshForm();
        });

      return;
    }

    onSuccess();
    this.refreshForm();
  }

  /**
   * Set value of the question with `input` as type.
   *
   * @param questionId question id
   * @param value value
   */
  setInput(questionId: string, value: any) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'input') {
      throw new Error('Question type is not input.');
    }

    this.setUnvalidatedAnswerAndValidate(question, value);
  }

  /**
   * Set value of the question with `single` as type.
   *
   * @param questionId question id
   * @param value choice's value
   */
  setChoice(questionId: string, value: ChoiceValue) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'single') {
      throw new Error('Question type is not single.');
    }

    const originalValue = this.questionUnvalidatedAnswerMap.get(questionId);
    const originalChoice = question.choices.find(choice => choice.value === originalValue);
    const newChoice = question.choices.find(choice => choice.value === value);

    if (value !== undefined && newChoice?.id === originalChoice?.id) {
      return;
    }

    this.setUnvalidatedAnswerAndValidate(question, newChoice?.value);

    if (originalChoice) {
      this.handleChoiceOnToggled(originalChoice, false);
    }
    if (newChoice) {
      this.handleChoiceOnToggled(newChoice, true);
    }
  }

  /**
   * Set values of the question with `multiple` as type.
   *
   * @param questionId question id
   * @param values choices' values
   */
  setChoices(questionId: string, values: ChoiceValue[]) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'multiple') {
      throw new Error('Question type is not multiple.');
    }

    const originalValues = this.questionUnvalidatedAnswerMap.get(questionId) || [];
    const originalChoices = question.choices.filter(choice => originalValues.includes(choice.value));
    const newChoices = question.choices.filter(choice => values.includes(choice.value));

    const removedChoices = originalChoices.filter(choice => !newChoices.find(c => c.id === choice.id));
    const addedChoices = newChoices.filter(choice => !originalChoices.find(c => c.id === choice.id));

    this.setUnvalidatedAnswerAndValidate(question, newChoices.map(choice => choice.value));

    removedChoices.forEach(choice => this.handleChoiceOnToggled(choice, false));
    addedChoices.forEach(choice => this.handleChoiceOnToggled(choice, true));
  }

  private handleChoiceOnToggled(choice: Choice, selected: boolean) {
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
        this.setGroupDisabled(group, true);
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
        this.setGroupDisabled(group, false);
      }
      if (question) {
        this.setQuestionDisabled(question, false);
      }
      if (choice) {
        this.setChoiceDisabled(choice, false);
      }
    });

    this.refreshForm();
  }

  private setGroupDisabled(group: Group, disabled: boolean) {
    group.disabled = disabled;
    group.groups.forEach(subGroup => this.setGroupDisabled(subGroup, disabled));
    // TODO
    // group.questions.forEach(question => this.setQuestionDisabled(question, disabled));
  }

  private setQuestionDisabled(question: Question, disabled: boolean) {
    question.disabled = disabled;
    question.choices.forEach(choice => this.setChoiceDisabled(choice, disabled));
  }

  private setChoiceDisabled(choice: Choice, disabled: boolean) {
    choice.disabled = disabled;
    let selected = false;
    if (!disabled) {
      const question = this.choiceQuestionMap.get(choice.id)!;
      if (question.type === 'single') {
        selected = this.questionUnvalidatedAnswerMap.get(question.id) === choice.value;
      } else if (question.type === 'multiple') {
        selected = !!this.questionUnvalidatedAnswerMap.get(question.id)?.includes(choice.value);
      }
    }
    this.handleChoiceOnToggled(choice, selected);
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

  /**
   * Import answers to the form.
   *
   * @param answers answers
   */
  importAnswers(answers: Answers) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      const answer = answers[questionId];

      if (question.type === 'input') {
        this.setInput(questionId, answer);
      } else if (question.type === 'single') {
        this.setChoice(questionId, answer);
      } else if (question.type === 'multiple') {
        this.setChoices(questionId, answer || []);
      }
    }
  }

  /**
   * Validate the entire form.
   *
   * @returns whether form is clean
   */
  validate() {
    const answers = this.getUnvalidatedAnswers();
    this.importAnswers(answers);
    return this.isClean();
  }

  private refreshForm() {
    const newRenderInstructions = this.getRenderInstructions();
    const hasChange = JSON.stringify(this.lastRenderInstructions) !== JSON.stringify(newRenderInstructions);
    this.lastRenderInstructions = newRenderInstructions;

    if (hasChange) {
      eventEmitter.emit(this.formId);

      if (this.formRefreshedHook) {
        this.formRefreshedHook();
      }
    }
  }

}
