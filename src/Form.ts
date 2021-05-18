import { Configs } from './Configs';
import { validateConfigs } from './ConfigsValidators';
import { fromGroupConfigs, toGroupConfigs } from './Converters';
import { ExportedConfigs } from './ExportedConfigs';
import { Choice, Group, Item, Question } from './FormObjects';
import { ChoiceRenderInstructions, GroupRenderInstructions, QuestionRenderInstructions, RenderInstructions } from './RenderInstructions';
import { Answers, ChoiceValue, Errors, FormUpdateListener, Validator, Validators } from './Types';

/**
 * @category Form
 */
export class Form {

  private onFormUpdate?: FormUpdateListener;
  private groups: Group[];
  private validators: Validators;
  private defaultAnswers: Answers = {};

  private groupMap = new Map<string, Group>();
  private questionMap = new Map<string, Question>();
  private choiceMap = new Map<string, Choice>();
  private groupParentGroupMap = new Map<string, Group>();
  private questionGroupMap = new Map<string, Group>();
  private choiceQuestionMap = new Map<string, Question>();
  private questionCurrentAnswerMap = new Map<string, any>();
  private questionValidatedAnswerMap = new Map<string, any>();
  private questionValidatingMap = new Map<string, boolean>();
  private questionErrorMap = new Map<string, any>();
  private itemDisabledByChoiceMap = new Map<string, Choice[]>();
  private itemEnabledByChoiceMap = new Map<string, Choice[]>();

  /**
   * Construct a form.
   *
   * @param configs configs
   * @throws if configs is invalid
   */
  constructor(configs: Configs);
  /**
   * Construct a form.
   *
   * @param configs configs
   * @param validators validators
   * @throws if configs is invalid
   */
  constructor(configs: Configs, validators: Validators);
  /**
   * Construct a form.
   *
   * @param configs configs
   * @param validators validators
   * @param skipValidations skip validations
   * @throws if configs is invalid
   */
  constructor(configs: Configs, validators: Validators, skipValidations: boolean);
  /**
   * Construct a form.
   *
   * @param configs configs
   * @param onFormUpdate function to be called when form is updated
   * @throws if configs is invalid
   */
  constructor(configs: Configs, onFormUpdate: FormUpdateListener);
  /**
   * Construct a form.
   *
   * @param configs configs
   * @param validators validators
   * @param onFormUpdate function to be called when form is updated
   * @throws if configs is invalid
   */
  constructor(configs: Configs, validators: Validators, onFormUpdate: FormUpdateListener);
  /**
   * Construct a form.
   *
   * @param configs configs
   * @param validators validators
   * @param skipValidations skip validations
   * @param onFormUpdate function to be called when form is updated
   * @throws if configs is invalid
   */
  constructor(configs: Configs, validators: Validators, skipValidations: boolean, onFormUpdate: FormUpdateListener);
  constructor(configs: Configs, arg1?: Validators | FormUpdateListener, arg2?: boolean | FormUpdateListener, arg3?: FormUpdateListener) {
    let validators: Validators = {};
    let onFormUpdate: FormUpdateListener | undefined;
    let skipValidations = false;

    const isFunction = (obj: any) => !!(obj?.constructor && obj.call && obj.apply);

    if (arg1 !== undefined) {
      if (isFunction(arg1)) {
        onFormUpdate = arg1 as FormUpdateListener;
      } else {
        validators = arg1 as Validators;
      }
    }

    if (arg2 !== undefined) {
      if (typeof arg2 === 'boolean') {
        skipValidations = arg2;
      } else {
        onFormUpdate = arg2;
      }
    }

    if (arg3) {
      onFormUpdate = arg3;
    }

    this.groups = fromGroupConfigs(undefined, configs);
    const result = validateConfigs(this.groups, false);
    if (!result.pass) {
      throw new Error('Invalid configs. You may use validateConfigs method to see what is wrong.');
    }

    this.validators = validators;
    this.onFormUpdate = onFormUpdate;
    this.processGroups(undefined, this.groups);
    this.endByInformFormUpdate(() => {
      this.internalImportAnswers(this.defaultAnswers, skipValidations);
    });
  }

  private processGroups(parentGroup: Group | undefined, groups: Group[]) {
    groups.forEach(group => {
      this.groupMap.set(group.id, group);
      this.processGroups(group, group.groups || []);
      this.processQuestions(group, group.questions || []);
      if (parentGroup) {
        this.groupParentGroupMap.set(group.id, parentGroup);
      }
    });
  }

  private processQuestions(group: Group, questions: Question[]) {
    questions.forEach(question => {
      this.questionMap.set(question.id, question);
      this.questionGroupMap.set(question.id, group);
      if (question.type !== 'any') {
        this.processChoices(question, question.choices);
      }
      if (!!question.defaultAnswer) {
        this.defaultAnswers[question.id] = question.defaultAnswer;
      }
    });
  }

  private processChoices(question: Question, choices: Choice[]) {
    choices.forEach(choice => {
      this.choiceMap.set(choice.id, choice);
      this.choiceQuestionMap.set(choice.id, question);

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

  /**
   * Get sanitized configs of this form.
   * You can persist it and use it to reconstruct the form later.
   *
   * @returns configs
   */
  getConfigs(): ExportedConfigs {
    return toGroupConfigs(this.groups);
  }

  /**
   * Get a set of instructions to be used for rendering frontend UI.
   *
   * @returns render instructions
   */
  getRenderInstructions(): RenderInstructions {
    return this.toGroupRenderInstructions(this.groups);
  }

  private toGroupRenderInstructions(groups: Group[]): GroupRenderInstructions[] {
    return groups.map((group): GroupRenderInstructions => ({
      id: group.id,
      disabled: this.isGroupDisabled(group),
      ui: group.ui,
      groups: this.toGroupRenderInstructions(group.groups),
      questions: this.toQuestionRenderInstructions(group.questions)
    }));
  }

  private toQuestionRenderInstructions(questions: Question[]): QuestionRenderInstructions[] {
    return questions.map((question): QuestionRenderInstructions => ({
      id: question.id,
      disabled: this.isQuestionDisabled(question),
      ui: question.ui,
      type: question.type,
      choices: question.type !== 'any' ? this.toChoiceRenderInstructions(question.choices) : [],
      currentAnswer: this.questionCurrentAnswerMap.get(question.id),
      validatedAnswer: this.isQuestionDisabled(question) ? undefined : this.questionValidatedAnswerMap.get(question.id),
      validating: !!this.questionValidatingMap.get(question.id),
      error: this.questionErrorMap.get(question.id)
    }));
  }

  private toChoiceRenderInstructions(choices: Choice[]): ChoiceRenderInstructions[] {
    return choices.map((choice): ChoiceRenderInstructions => ({
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

  private findChoice(choiceId: string) {
    const choice = this.choiceMap.get(choiceId);
    if (!choice) {
      throw new Error('Choice is not found.');
    }
    return choice;
  }

  /**
   * Clear answers of the entire form.
   *
   * @param skipValidations skip validations
   */
  clear(skipValidations = false) {
    this.endByInformFormUpdate(() => {
      for (const group of this.groups) {
        this.internalClearGroup(group.id, skipValidations);
      }
    });
  }

  /**
   * Clear answers of the entire group.
   *
   * @param groupId group id
   * @param skipValidations skip validations
   */
  clearGroup(groupId: string, skipValidations = false) {
    this.endByInformFormUpdate(() => {
      this.internalClearGroup(groupId, skipValidations);
    });
  }

  private internalClearGroup(groupId: string, skipValidations: boolean) {
    const group = this.findGroup(groupId);

    for (const subGroup of group.groups) {
      this.internalClearGroup(subGroup.id, skipValidations);
    }
    for (const question of group.questions) {
      this.internalClearAnswer(question.id, skipValidations);
    }
  }

  /**
   * Clear answer of a question.
   *
   * @param questionId question id
   * @param skipValidation skip validation
   */
  clearAnswer(questionId: string, skipValidation = false) {
    this.endByInformFormUpdate(() => {
      this.internalClearAnswer(questionId, skipValidation);
    });
  }

  private internalClearAnswer(questionId: string, skipValidation: boolean) {
    const question = this.findQuestion(questionId);

    if (question.type === 'any') {
      this.internalSetAnswer(question.id, undefined, skipValidation);
    } else if (question.type === 'single') {
      this.internalSetChoice(question.id, undefined, skipValidation);
    } else if (question.type === 'multiple') {
      this.internalSetChoices(question.id, [], skipValidation);
    }
  }

  /**
   * Reset answers of the entire form to default answers.
   *
   * @param skipValidations skip validations
   */
  reset(skipValidations = false) {
    this.endByInformFormUpdate(() => {
      for (const group of this.groups) {
        this.internalResetGroup(group.id, skipValidations);
      }
    });
  }

  /**
   * Reset answers of the entire group to default answers.
   *
   * @param groupId group id
   * @param skipValidations skip validations
   */
  resetGroup(groupId: string, skipValidations = false) {
    this.endByInformFormUpdate(() => {
      this.internalResetGroup(groupId, skipValidations);
    });
  }

  private internalResetGroup(groupId: string, skipValidations: boolean) {
    const group = this.findGroup(groupId);

    for (const subGroup of group.groups) {
      this.internalResetGroup(subGroup.id, skipValidations);
    }
    for (const question of group.questions) {
      this.internalResetAnswer(question.id, skipValidations);
    }
  }

  /**
   * Reset answer of a question to default answer.
   *
   * @param questionId question id
   * @param skipValidation skip validation
   */
  resetAnswer(questionId: string, skipValidation = false) {
    this.endByInformFormUpdate(() => {
      this.internalResetAnswer(questionId, skipValidation);
    });
  }

  private internalResetAnswer(questionId: string, skipValidation: boolean) {
    const question = this.findQuestion(questionId);

    const defaultAnswer = this.defaultAnswers[questionId];

    if (question.type === 'any') {
      this.internalSetAnswer(question.id, defaultAnswer, skipValidation);
    } else if (question.type === 'single') {
      this.internalSetChoice(question.id, defaultAnswer, skipValidation);
    } else if (question.type === 'multiple') {
      this.internalSetChoices(question.id, defaultAnswer || [], skipValidation);
    }
  }

  private getValidators(names: string[]) {
    const validators: Validator[] = [];

    for (const name of names) {
      const validator = this.validators[name];
      if (validator) {
        validators.push(validator);
      }
    }

    return validators;
  }

  private executeValidators(validators: Validator[], question: Question, answer: any): void | Promise<void> {
    const validator = validators.shift();

    if (!validator) {
      return;
    }

    const validationResult = validator(answer, question.validation);

    if (validationResult instanceof Promise) {
      return validationResult.then(() => this.executeValidators(validators, question, answer));
    }

    return this.executeValidators(validators, question, answer);
  }

  private setCurrentAnswerAndValidate(question: Question, answer: any, skipValidation: boolean) {
    this.questionCurrentAnswerMap.set(question.id, answer);

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

    this.questionCurrentAnswerMap.set(question.id, answer);

    const onSuccess = () => {
      this.questionValidatedAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    };

    const onError = (err: any) => {
      this.questionValidatedAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err);
    };

    const validators = this.getValidators(question.validators);
    if (!validators.length) {
      onSuccess();
      return;
    }

    if (skipValidation) {
      this.questionValidatedAnswerMap.delete(question.id);
      this.questionErrorMap.delete(question.id);
      return;
    }

    let validationResult: void | Promise<void>;
    try {
      validationResult = this.executeValidators(validators, question, answer);
    } catch (err) {
      onError(err);
      return;
    }

    if (validationResult instanceof Promise) {
      this.questionValidatingMap.set(question.id, true);

      validationResult
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          this.questionValidatingMap.delete(question.id);
          this.informFormUpdate();
        });

      return;
    }

    onSuccess();
  }

  /**
   * Set answer of the question with `any` as [[type]].
   *
   * @param questionId question id
   * @param answer answer
   * @param skipValidation skip validation
   */
  setAnswer(questionId: string, answer: any, skipValidation = false) {
    this.endByInformFormUpdate(() => {
      this.internalSetAnswer(questionId, answer, skipValidation);
    });
  }

  private internalSetAnswer(questionId: string, answer: any, skipValidation: boolean) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'any') {
      throw new Error('Question type is not any.');
    }

    this.setCurrentAnswerAndValidate(question, answer, skipValidation);
  }

  /**
   * Set answer of the question with `single` as [[type]].
   *
   * @param questionId question id
   * @param value choice's value
   * @param skipValidation skip validation
   */
  setChoice(questionId: string, value: ChoiceValue | undefined, skipValidation = false) {
    this.endByInformFormUpdate(() => {
      this.internalSetChoice(questionId, value, skipValidation);
    });
  }

  private internalSetChoice(questionId: string, value: ChoiceValue | undefined, skipValidation: boolean) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'single') {
      throw new Error('Question type is not single.');
    }

    const choice = question.choices.find(choice => choice.value === value);
    this.setCurrentAnswerAndValidate(question, choice?.value, skipValidation);
  }

  /**
   * Set answers of the question with `multiple` as [[type]].
   *
   * @param questionId question id
   * @param values choices' values
   * @param skipValidation skip validation
   */
  setChoices(questionId: string, values: ChoiceValue[], skipValidation = false) {
    this.endByInformFormUpdate(() => {
      this.internalSetChoices(questionId, values, skipValidation);
    });
  }

  private internalSetChoices(questionId: string, values: ChoiceValue[], skipValidation: boolean) {
    const question = this.findQuestion(questionId);
    if (question.type !== 'multiple') {
      throw new Error('Question type is not multiple.');
    }

    const choices = question.choices.filter(choice => values.includes(choice.value));
    this.setCurrentAnswerAndValidate(question, choices.map(choice => choice.value), skipValidation);
  }

  /**
   * Select invididual choice.
   * Can be used by questions with `single` or `multiple` as [[type]] only.
   *
   * @param choiceId choice id
   * @param selected selected/unselected
   * @param skipValidation skip validation
   */
  selectChoice(choiceId: string, selected: boolean, skipValidation = false) {
    this.endByInformFormUpdate(() => {
      this.internalSelectChoice(choiceId, selected, skipValidation);
    });
  }

  private internalSelectChoice(choiceId: string, selected: boolean, skipValidation: boolean) {
    const choice = this.findChoice(choiceId);
    const question = this.choiceQuestionMap.get(choiceId)!;

    let currentAnswer = this.questionCurrentAnswerMap.get(question.id);

    if (question.type === 'single') {
      if (selected) {
        this.internalSetChoice(question.id, choice.value, skipValidation);
      } else if (choice.value === currentAnswer) {
        this.internalSetChoice(question.id, undefined, skipValidation);
      }
    } else if (question.type === 'multiple') {
      currentAnswer = currentAnswer || [];
      currentAnswer = currentAnswer.filter(value => value !== choice.value);
      if (selected) {
        currentAnswer.push(choice.value);
      }
      this.internalSetChoices(question.id, currentAnswer, skipValidation);
    }
  }

  private isChoiceSelected(choice: Choice) {
    if (this.isChoiceDisabled(choice)) {
      return false;
    }

    const question = this.choiceQuestionMap.get(choice.id)!;
    if (question.type === 'single') {
      const answer = this.questionCurrentAnswerMap.get(question.id);
      return choice.value === answer;
    }
    if (question.type === 'multiple') {
      const answer = this.questionCurrentAnswerMap.get(question.id);
      return !!answer?.includes(choice.value);
    }

    return false;
  }

  private isItemDisabled(item: Item) {
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
   * Get current answers. The answers are unvalidated.
   * You can persist it and use it with [[importAnswers]] method to restore the answers later.
   *
   * @returns current answers
   */
  getCurrentAnswers(): Answers {
    const answes: Answers = {};

    for (const entry of this.questionMap.entries()) {
      const [questionId] = entry;
      const answer = this.questionCurrentAnswerMap.get(questionId);
      if (answer !== undefined) {
        answes[questionId] = answer;
      }
    }

    return answes;
  }

  /**
   * Get validated answers.
   * If a question is disabled or it's answer is not valid, it's answer will be set to `undefined`.
   * You can persist it and use it with [[importAnswers]] method to restore the answers later.
   *
   * @returns validated answers
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
   * Get errors.
   *
   * Questions which didn't go through validation will not have errors, even if their answers are currently invalid.
   * You can use [[validate]] method to validate all answers in the form.
   *
   * @returns errors
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
   * You can use [[validate]] method to validate all answers in the form.
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
    this.endByInformFormUpdate(() => {
      this.internalImportAnswers(answers, skipValidations);
    });
  }

  private internalImportAnswers(answers: Answers, skipValidations: boolean) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      const answer = answers[questionId];

      if (question.type === 'any') {
        this.internalSetAnswer(questionId, answer, skipValidations);
      } else if (question.type === 'single') {
        this.internalSetChoice(questionId, answer, skipValidations);
      } else if (question.type === 'multiple') {
        this.internalSetChoices(questionId, answer || [], skipValidations);
      }
    }
  }

  /**
   * Validate the entire form.
   *
   * @returns whether form is clean
   */
  validate() {
    return this.endByInformFormUpdate(() => {
      const answers = this.getCurrentAnswers();
      this.internalImportAnswers(answers, false);
      return this.isClean();
    });
  }

  private endByInformFormUpdate<T>(action: () => T) {
    const result = action();
    this.informFormUpdate();
    return result;
  }

  private informFormUpdate() {
    this.onFormUpdate?.(this);
  }

  // TODO: - No circular choices' `onSelected` configs
  /**
   * Validate configs.
   *
   * The following validations will be conducted:
   * - Form is not without any groups
   * - No duplicated ids within the form
   * - No duplicated choice values within a question
   * - No groups without questions
   * - No `single` or `multiple` questions without choices
   *
   * Put `strict` as `true` to validate the following:
   * - No unrecognized ids in choices' `onSelected` configs
   *
   * @param configs configs
   * @param strict strict
   * @returns validation result
   */
  static validateConfigs(configs: Configs, strict = false) {
    const groups = fromGroupConfigs(undefined, configs);
    return validateConfigs(groups, strict);
  }

}
