import shortUUID from 'short-uuid';
import { Configs } from './Configs';
import { fromGroupInitConfigs, toGroupConfigs } from './Converters';
import { eventEmitter } from './EventEmitter';
import { Choice, Group, ManagebleItem, Question } from './FormObjects';
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
  private itemDisabledByChoiceMap = new Map<string, Choice[]>();
  private itemEnabledByChoiceMap = new Map<string, Choice[]>();

  private constructor(groups: Group[], validators: Record<string, Validator>, skipValidations: boolean, formRefreshedHook?: FormRefreshedHook) {
    this.formId = shortUUID.generate();
    this.groups = groups;
    this.validators = validators;
    this.formRefreshedHook = formRefreshedHook;
    this.constructGroupMap(undefined, this.groups);
    if (!skipValidations) {
      this.validate();
    }
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

      choice.onSelected.disable?.forEach(id => {
        let disabledBy = this.itemDisabledByChoiceMap.get(id);
        if (!disabledBy) {
          disabledBy = [];
        }
        disabledBy.push(choice);
        this.itemDisabledByChoiceMap.set(id, disabledBy);
      });

      choice.onSelected.enable?.forEach(id => {
        let enabledBy = this.itemEnabledByChoiceMap.get(id);
        if (!enabledBy) {
          enabledBy = [];
        }
        enabledBy.push(choice);
        this.itemEnabledByChoiceMap.set(id, enabledBy);
      });
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
   * @param skipValidations skip validations
   * @param formRefreshedHook function to be invoked when form is refreshed
   * @returns form object
   */
  static fromConfigs(configs: InitConfigs, validators?: Record<string, Validator>, skipValidations = false,
    formRefreshedHook: FormRefreshedHook | undefined = undefined) {
    const groups = fromGroupInitConfigs(undefined, configs);
    return new Form(groups, validators || {}, skipValidations, formRefreshedHook);
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
   *
   * @param skipValidations skip validations
   */
  clear(skipValidations = false) {
    for (const group of this.groups) {
      this.clearGroup(group.id, skipValidations);
    }

    this.refreshForm();
  }

  /**
   * Clear answers of the entire group.
   *
   * @param groupId group id
   * @param skipValidations skip validations
   */
  clearGroup(groupId: string, skipValidations = false) {
    const group = this.findGroup(groupId);

    for (const subGroup of group.groups) {
      this.clearGroup(subGroup.id, skipValidations);
    }
    for (const question of group.questions) {
      this.clearAnswer(question.id, skipValidations);
    }

    this.refreshForm();
  }

  /**
   * Clear answer of a question.
   *
   * @param questionId question id
   * @param skipValidation skip validation
   */
  clearAnswer(questionId: string, skipValidation = false) {
    const question = this.findQuestion(questionId);

    if (question.type === 'input') {
      this.setInput(question.id, undefined, skipValidation);
    } else if (question.type === 'single') {
      this.setChoice(question.id, undefined as any, skipValidation);
    } else if (question.type === 'multiple') {
      this.setChoices(question.id, [], skipValidation);
    }

    this.refreshForm();
  }

  private setUnvalidatedAnswerAndValidate(question: Question, answer: any, skipValidation: boolean) {
    this.questionUnvalidatedAnswerMap.set(question.id, answer);

    if (question.type === 'single') {
      const choice = question.choices.find(choice => choice.value === answer);
      if (choice && this.isChoiceDisabled(choice)) {
        answer = undefined;
      }
    } else if (question.type === 'multiple') {
      let choices = question.choices.filter(choice => answer.includes(choice.value));
      choices = choices.filter(choice => !this.isChoiceDisabled(choice));
      answer = choices.map(choice => choice.value);
    }

    this.questionUnvalidatedAnswerMap.set(question.id, answer);

    const onSuccess = () => {
      this.questionValidatedAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    };

    const onError = (err: any) => {
      this.questionValidatedAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    };

    const validator = question.validator ? this.validators[question.validator] : undefined;
    if (!validator) {
      onSuccess();
      this.refreshForm();
      return;
    }

    if (skipValidation) {
      this.questionValidatedAnswerMap.delete(question.id);
      this.questionErrorMap.delete(question.id);
      this.refreshForm();
      return;
    }

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
   * @param skipValidation skip validation
   */
  setInput(questionId: string, value: any, skipValidation = false) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'input') {
      throw new Error('Question type is not input.');
    }

    this.setUnvalidatedAnswerAndValidate(question, value, skipValidation);
  }

  /**
   * Set value of the question with `single` as type.
   *
   * @param questionId question id
   * @param value choice's value
   * @param skipValidation skip validation
   */
  setChoice(questionId: string, value: ChoiceValue, skipValidation = false) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'single') {
      throw new Error('Question type is not single.');
    }

    const choice = question.choices.find(choice => choice.value === value);
    this.setUnvalidatedAnswerAndValidate(question, choice?.value, skipValidation);
  }

  /**
   * Set values of the question with `multiple` as type.
   *
   * @param questionId question id
   * @param values choices' values
   * @param skipValidation skip validation
   */
  setChoices(questionId: string, values: ChoiceValue[], skipValidation = false) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'multiple') {
      throw new Error('Question type is not multiple.');
    }

    const choices = question.choices.filter(choice => values.includes(choice.value));
    this.setUnvalidatedAnswerAndValidate(question, choices.map(choice => choice.value), skipValidation);
  }

  private isChoiceSelected(choice: Choice) {
    if (this.isChoiceDisabled(choice)) {
      return false;
    }

    const question = this.choiceQuestionMap.get(choice.id)!;
    if (question.type === 'single') {
      const answer = this.questionUnvalidatedAnswerMap.get(question.id);
      return choice.value === answer;
    }
    if (question.type === 'multiple') {
      const answer = this.questionUnvalidatedAnswerMap.get(question.id);
      return !!answer?.includes(choice.value);
    }

    return false;
  }

  private isItemDisabled(item: ManagebleItem) {
    const disabledByChoices = this.itemDisabledByChoiceMap.get(item.id) || [];

    for (const choice of disabledByChoices) {
      if (this.isChoiceSelected(choice)) {
        return true;
      }
    }

    const enabledByChoices = this.itemEnabledByChoiceMap.get(item.id) || [];

    for (const choice of enabledByChoices) {
      if (this.isChoiceSelected(choice)) {
        return false;
      }
    }

    return item.defaultDisabled;
  }

  private isGroupDisabled(group: Group): boolean {
    const parentGroup = this.groupParentGroupMap.get(group.id);
    if (parentGroup && this.isGroupDisabled(parentGroup)) {
      return true;
    }

    return this.isItemDisabled(group);
  }

  private isQuestionDisabled(question: Question) {
    const group = this.questionGroupMap.get(question.id)!;
    if (this.isGroupDisabled(group)) {
      return true;
    }

    return this.isItemDisabled(question);
  }

  private isChoiceDisabled(choice: Choice) {
    const question = this.choiceQuestionMap.get(choice.id)!;
    if (this.isQuestionDisabled(question)) {
      return true;
    }

    return this.isItemDisabled(choice);
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
   * @skipValidations skip validations
   */
  importAnswers(answers: Answers, skipValidations = false) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      const answer = answers[questionId];

      if (question.type === 'input') {
        this.setInput(questionId, answer, skipValidations);
      } else if (question.type === 'single') {
        this.setChoice(questionId, answer, skipValidations);
      } else if (question.type === 'multiple') {
        this.setChoices(questionId, answer || [], skipValidations);
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
