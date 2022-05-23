import { Configs } from './Configs';
import { sanitizeConfigs } from './ConfigsSanitizers';
import { ConfigsValidator } from './ConfigsValidator';
import { Choice, ExportedConfigs, Group, Item, Question } from './ExportedConfigs';
import { ChoiceRenderInstructions, GroupRenderInstructions, QuestionRenderInstructions, RenderInstructions } from './RenderInstructions';
import { Answers, ConfigsValidationResult, Errors, FormUpdateListener, Validator, Validators } from './Types';

export interface UpdateAnswerOptions {
  /**
   * Validate the answer, default = `true`
   */
  validate?: boolean;
}

export interface FormOptions extends UpdateAnswerOptions {
  /**
   * Validators
   */
  validators?: Validators;
  /**
   * Function to be called when form is updated
   */
  onFormUpdate?: FormUpdateListener;
}

/**
 * @category Form
 */
export class Form<Custom = any> {

  #onFormUpdate?: FormUpdateListener;
  #validators: Validators = {};
  readonly #configs: ExportedConfigs<Custom>;
  readonly #defaultAnswers: Answers = {};

  readonly #groupById = new Map<string, Group>();
  readonly #questionById = new Map<string, Question>();
  readonly #choiceById = new Map<string, Choice>();
  readonly #parentGroupByGroupId = new Map<string, Group>();
  readonly #groupByQuestionId = new Map<string, Group>();
  readonly #questionByChoiceId = new Map<string, Question>();
  readonly #currentAnswerByQuestionId = new Map<string, any>();
  readonly #validatedAnswerByQuestionId = new Map<string, any>();
  readonly #validatingByQuestionId = new Map<string, boolean>();
  readonly #errorByQuestionId = new Map<string, any>();
  readonly #disabledByChoicesById = new Map<string, Choice[]>();
  readonly #enabledByChoicesById = new Map<string, Choice[]>();

  /**
   * Construct a form.
   *
   * @param configs configs
   * @param options options
   * @throws if configs is invalid
   */
  constructor(configs: Configs<Custom>, options?: FormOptions) {
    this.#configs = sanitizeConfigs(configs);

    const result = new ConfigsValidator().validate(this.#configs, false);
    if (!result.pass) {
      throw new Error('Invalid configs. You may use validateConfigs method to see what is wrong.');
    }

    this.setValidators(options?.validators);
    this.setUpdateListener(options?.onFormUpdate);

    this.#processGroups(undefined, this.#configs.groups);
    this.#processQuestions(undefined, this.#configs.questions);
    this.#endByInformFormUpdate(() => {
      this.#internalImportAnswers(this.#defaultAnswers, options);
    });
  }

  setValidators(validators: Validators | undefined) {
    this.#validators = validators || {};
  }

  setUpdateListener(onFormUpdate?: FormUpdateListener | undefined) {
    this.#onFormUpdate = onFormUpdate;
  }

  #processGroups(parentGroup: Group<Custom> | undefined, groups: Group<Custom>[]) {
    groups.forEach(group => {
      this.#groupById.set(group.id, group);
      this.#processGroups(group, group.groups || []);
      this.#processQuestions(group, group.questions || []);
      if (parentGroup) {
        this.#parentGroupByGroupId.set(group.id, parentGroup);
      }
    });
  }

  #processQuestions(group: Group<Custom> | undefined, questions: Question<Custom>[]) {
    questions.forEach(question => {
      this.#questionById.set(question.id, question);
      if (group) {
        this.#groupByQuestionId.set(question.id, group);
      }
      if (question.type !== 'any') {
        this.#processChoices(question, question.choices);
      }
      if (!!question.defaultAnswer) {
        this.#defaultAnswers[question.id] = question.defaultAnswer;
      }
    });
  }

  #processChoices(question: Question<Custom>, choices: Choice<Custom>[]) {
    choices.forEach(choice => {
      this.#choiceById.set(choice.id, choice);
      this.#questionByChoiceId.set(choice.id, question);

      choice.onSelected.disable?.forEach(id => {
        let disabledByChoices = this.#disabledByChoicesById.get(id);
        if (!disabledByChoices) {
          disabledByChoices = [];
        }
        disabledByChoices.push(choice);
        this.#disabledByChoicesById.set(id, disabledByChoices);
      });

      choice.onSelected.enable?.forEach(id => {
        let enabledByChoices = this.#enabledByChoicesById.get(id);
        if (!enabledByChoices) {
          enabledByChoices = [];
        }
        enabledByChoices.push(choice);
        this.#enabledByChoicesById.set(id, enabledByChoices);
      });
    });
  }

  /**
   * Get sanitized configs of this form.
   *
   * You can persist it and use it to reconstruct the form later.
   *
   * @returns configs
   */
  getConfigs(): ExportedConfigs<Custom> {
    return this.#configs;
  }

  /**
   * Get a set of instructions to be used for rendering frontend UI.
   *
   * @returns render instructions
   */
  getRenderInstructions(): RenderInstructions<Custom> {
    const groups = this.#toGroupRenderInstructions(this.#configs.groups);
    const questions = this.#toQuestionRenderInstructions(this.#configs.questions);
    const validating = groups.some(group => group.validating) || questions.some(question => question.validating);
    return { validating, groups, questions };
  }

  #toGroupRenderInstructions(groups: Group<Custom>[]): GroupRenderInstructions<Custom>[] {
    return groups.map((group): GroupRenderInstructions<Custom> => {
      const groups = this.#toGroupRenderInstructions(group.groups);
      const questions = this.#toQuestionRenderInstructions(group.questions);
      const validating = groups.some(group => group.validating) || questions.some(question => question.validating);

      return {
        id: group.id,
        disabled: this.#isGroupDisabled(group),
        custom: group.custom,
        validating,
        groups,
        questions
      };
    });
  }

  #toQuestionRenderInstructions(questions: Question<Custom>[]): QuestionRenderInstructions<Custom>[] {
    return questions.map((question): QuestionRenderInstructions<Custom> => ({
      id: question.id,
      disabled: this.#isQuestionDisabled(question),
      custom: question.custom,
      type: question.type,
      choices: question.type !== 'any' ? this.#toChoiceRenderInstructions(question.choices) : [],
      currentAnswer: this.#currentAnswerByQuestionId.get(question.id),
      validatedAnswer: this.#isQuestionDisabled(question) ? undefined : this.#validatedAnswerByQuestionId.get(question.id),
      validating: !!this.#validatingByQuestionId.get(question.id),
      error: this.#errorByQuestionId.get(question.id)
    }));
  }

  #toChoiceRenderInstructions(choices: Choice<Custom>[]): ChoiceRenderInstructions<Custom>[] {
    return choices.map((choice): ChoiceRenderInstructions<Custom> => ({
      id: choice.id,
      disabled: this.#isChoiceDisabled(choice),
      custom: choice.custom,
      value: choice.value
    }));
  }

  #findGroup(groupId: string) {
    const group = this.#groupById.get(groupId);
    if (!group) {
      throw new Error('Group is not found.');
    }
    return group;
  }

  #findQuestion(questionId: string) {
    const question = this.#questionById.get(questionId);
    if (!question) {
      throw new Error('Question is not found.');
    }
    return question;
  }

  #findChoice(choiceId: string) {
    const choice = this.#choiceById.get(choiceId);
    if (!choice) {
      throw new Error('Choice is not found.');
    }
    return choice;
  }

  /**
   * Clear answers of the entire form.
   *
   * @param options options
   */
  clear(options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      for (const group of this.#configs.groups) {
        this.#internalClearGroup(group.id, options);
      }
    });
  }

  /**
   * Clear answers of the entire group.
   *
   * @param groupId group id
   * @param options options
   */
  clearGroup(groupId: string, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalClearGroup(groupId, options);
    });
  }

  #internalClearGroup(groupId: string, options?: UpdateAnswerOptions) {
    const group = this.#findGroup(groupId);

    for (const subGroup of group.groups) {
      this.#internalClearGroup(subGroup.id, options);
    }
    for (const question of group.questions) {
      this.#internalClearAnswer(question.id, options);
    }
  }

  /**
   * Clear answer of a question.
   *
   * @param questionId question id
   * @param options options
   */
  clearAnswer(questionId: string, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalClearAnswer(questionId, options);
    });
  }

  #internalClearAnswer(questionId: string, options?: UpdateAnswerOptions) {
    const question = this.#findQuestion(questionId);
    this.#internalSetAnswer(question.id, undefined, options);
  }

  /**
   * Reset answers of the entire form to default answers.
   *
   * @param options options
   */
  reset(options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      for (const group of this.#configs.groups) {
        this.#internalResetGroup(group.id, options);
      }
    });
  }

  /**
   * Reset answers of the entire group to default answers.
   *
   * @param groupId group id
   * @param options options
   */
  resetGroup(groupId: string, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalResetGroup(groupId, options);
    });
  }

  #internalResetGroup(groupId: string, options?: UpdateAnswerOptions) {
    const group = this.#findGroup(groupId);

    for (const subGroup of group.groups) {
      this.#internalResetGroup(subGroup.id, options);
    }
    for (const question of group.questions) {
      this.#internalResetAnswer(question.id, options);
    }
  }

  /**
   * Reset answer of a question to default answer.
   *
   * @param questionId question id
   * @param options options
   */
  resetAnswer(questionId: string, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalResetAnswer(questionId, options);
    });
  }

  #internalResetAnswer(questionId: string, options?: UpdateAnswerOptions) {
    const question = this.#findQuestion(questionId);
    const defaultAnswer = this.#defaultAnswers[questionId];
    this.#internalSetAnswer(question.id, defaultAnswer, options);
  }

  /**
   * Import answers to the form.
   *
   * @param answers answers
   * @param options options
   */
  importAnswers(answers: Answers, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalImportAnswers(answers, options);
    });
  }

  #internalImportAnswers(answers: Answers, options?: UpdateAnswerOptions) {
    for (const questionId of this.#questionById.keys()) {
      const answer = answers[questionId];
      this.#internalSetAnswer(questionId, answer, options);
    }
  }

  #getValidators(names: string[]) {
    const validators: Validator[] = [];

    for (const name of names) {
      const validator = this.#validators[name];
      if (validator) {
        validators.push(validator);
      }
    }

    return validators;
  }

  #executeValidators(validators: Validator[], question: Question<Custom>, answer: any, previousAnswer: any): void | Promise<void> {
    const validator = validators.shift();

    if (!validator) {
      return;
    }

    const validationResult = validator(answer, question, previousAnswer, this);

    if (validationResult instanceof Promise) {
      return validationResult.then(() => this.#executeValidators(validators, question, answer, previousAnswer));
    }

    return this.#executeValidators(validators, question, answer, previousAnswer);
  }

  #setCurrentAnswerAndValidate(question: Question<Custom>, answer: any, options?: UpdateAnswerOptions) {
    const previousAnswer = this.#currentAnswerByQuestionId.get(question.id);

    this.#currentAnswerByQuestionId.set(question.id, answer);

    if (question.type === 'choice') {
      const choice = question.choices.find(choice => choice.value === answer);
      if (choice && this.#isChoiceDisabled(choice)) {
        answer = undefined;
      }
    } else if (question.type === 'choices') {
      let choices = question.choices.filter(choice => answer.includes(choice.value));
      choices = choices.filter(choice => !this.#isChoiceDisabled(choice));
      answer = choices.map(choice => choice.value);
    }

    this.#currentAnswerByQuestionId.set(question.id, answer);

    const onSuccess = () => {
      this.#validatedAnswerByQuestionId.set(question.id, answer);
      this.#errorByQuestionId.delete(question.id);
    };

    const onError = (err: any) => {
      this.#validatedAnswerByQuestionId.delete(question.id);
      this.#errorByQuestionId.set(question.id, err);
    };

    const validators = this.#getValidators(question.validators);
    if (!validators.length) {
      onSuccess();
      return;
    }

    if (options?.validate === false) {
      this.#validatedAnswerByQuestionId.delete(question.id);
      this.#errorByQuestionId.delete(question.id);
      return;
    }

    let validationResult: void | Promise<void>;
    try {
      validationResult = this.#executeValidators(validators, question, answer, previousAnswer);
    } catch (err) {
      onError(err);
      return;
    }

    if (validationResult instanceof Promise) {
      this.#validatingByQuestionId.set(question.id, true);

      validationResult
        .then(onSuccess)
        .catch(onError)
        .finally(() => {
          this.#validatingByQuestionId.delete(question.id);
          this.#informFormUpdate();
        });

      return;
    }

    onSuccess();
  }

  /**
   * Set answer of a question.
   *
   * @param questionId question id
   * @param answer answer
   * @param options options
   */
  setAnswer(questionId: string, answer: any, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalSetAnswer(questionId, answer, options);
    });
  }

  #internalSetAnswer(questionId: string, answer: any, options?: UpdateAnswerOptions) {
    const question = this.#findQuestion(questionId);

    if (question.type === 'any') {
      this.#internalSetAny(question.id, answer, options);
    } else if (question.type === 'choice') {
      this.#internalSetChoice(question.id, answer, options);
    } else if (question.type === 'choices') {
      this.#internalSetChoices(question.id, answer || [], options);
    }
  }

  /**
   * Set answer of a question with `any` as [[type]].
   *
   * @param questionId question id
   * @param answer answer
   * @param options options
   */
  setAny(questionId: string, answer: any, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalSetAny(questionId, answer, options);
    });
  }

  #internalSetAny(questionId: string, answer: any, options?: UpdateAnswerOptions) {
    const question = this.#findQuestion(questionId);
    if (question.type !== 'any') {
      throw new Error("Question type is not 'any'.");
    }

    this.#setCurrentAnswerAndValidate(question, answer, options);
  }

  /**
   * Set answer of a question with `choice` as [[type]].
   *
   * @param questionId question id
   * @param value choice's value
   * @param options options
   */
  setChoice(questionId: string, value: any, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalSetChoice(questionId, value, options);
    });
  }

  #internalSetChoice(questionId: string, value: any, options?: UpdateAnswerOptions) {
    const question = this.#findQuestion(questionId);
    if (question.type !== 'choice') {
      throw new Error("Question type is not 'choice'.");
    }

    const choice = question.choices.find(choice => choice.value === value);
    this.#setCurrentAnswerAndValidate(question, choice?.value, options);
  }

  /**
   * Set answers of a question with `choices` as [[type]].
   *
   * @param questionId question id
   * @param values choices' values
   * @param options options
   */
  setChoices(questionId: string, values: any[], options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalSetChoices(questionId, values, options);
    });
  }

  #internalSetChoices(questionId: string, values: any[], options?: UpdateAnswerOptions) {
    const question = this.#findQuestion(questionId);
    if (question.type !== 'choices') {
      throw new Error("Question type is not 'choices'.");
    }

    const choices = question.choices.filter(choice => values.includes(choice.value));
    this.#setCurrentAnswerAndValidate(question, choices.map(choice => choice.value), options);
  }

  /**
   * Select invididual choice.
   *
   * This method can be used by questions with `choice` or `choices` as [[type]] only.
   *
   * @param choiceId choice id
   * @param selected selected/unselected
   * @param options options
   */
  selectChoice(choiceId: string, selected: boolean, options?: UpdateAnswerOptions) {
    this.#endByInformFormUpdate(() => {
      this.#internalSelectChoice(choiceId, selected, options);
    });
  }

  #internalSelectChoice(choiceId: string, selected: boolean, options?: UpdateAnswerOptions) {
    const choice = this.#findChoice(choiceId);
    const question = this.#questionByChoiceId.get(choiceId)!;

    let currentAnswer = this.#currentAnswerByQuestionId.get(question.id);

    if (question.type === 'choice') {
      if (selected) {
        this.#internalSetChoice(question.id, choice.value, options);
      } else if (choice.value === currentAnswer) {
        this.#internalSetChoice(question.id, undefined, options);
      }
    } else if (question.type === 'choices') {
      currentAnswer = currentAnswer || [];
      currentAnswer = currentAnswer.filter(value => value !== choice.value);
      if (selected) {
        currentAnswer.push(choice.value);
      }
      this.#internalSetChoices(question.id, currentAnswer, options);
    }
  }

  #isChoiceSelected(choice: Choice<Custom>) {
    if (this.#isChoiceDisabled(choice)) {
      return false;
    }

    const question = this.#questionByChoiceId.get(choice.id)!;
    if (question.type === 'choice') {
      const answer = this.#currentAnswerByQuestionId.get(question.id);
      return choice.value === answer;
    }
    if (question.type === 'choices') {
      const answer = this.#currentAnswerByQuestionId.get(question.id);
      return !!answer?.includes(choice.value);
    }

    return false;
  }

  #isItemDisabled(item: Item<Custom>) {
    const disabledByChoices = this.#disabledByChoicesById.get(item.id) || [];

    for (const choice of disabledByChoices) {
      if (this.#isChoiceSelected(choice)) {
        return true;
      }
    }

    const enabledByChoices = this.#enabledByChoicesById.get(item.id) || [];

    for (const choice of enabledByChoices) {
      if (this.#isChoiceSelected(choice)) {
        return false;
      }
    }

    return item.defaultDisabled;
  }

  #isGroupDisabled(group: Group<Custom>): boolean {
    const parentGroup = this.#parentGroupByGroupId.get(group.id);
    if (parentGroup && this.#isGroupDisabled(parentGroup)) {
      return true;
    }
    return this.#isItemDisabled(group);
  }

  #isQuestionDisabled(question: Question<Custom>) {
    const group = this.#groupByQuestionId.get(question.id);
    if (group && this.#isGroupDisabled(group)) {
      return true;
    }
    return this.#isItemDisabled(question);
  }

  #isChoiceDisabled(choice: Choice<Custom>) {
    const question = this.#questionByChoiceId.get(choice.id)!;
    if (this.#isQuestionDisabled(question)) {
      return true;
    }
    return this.#isItemDisabled(choice);
  }

  /**
   * Get current answer of a question. The answer is unvalidated.
   *
   * @param questionId question id
   * @returns current answer
   */
  getCurrentAnswer(questionId: string) {
    return this.#currentAnswerByQuestionId.get(questionId);
  }

  /**
   * Get current answers. The answers are unvalidated.
   *
   * You can persist it and use it with [[importAnswers]] method to restore the answers later.
   *
   * @returns current answers
   */
  getCurrentAnswers(): Answers {
    const answers: Answers = {};

    for (const [questionId] of this.#questionById.entries()) {
      const answer = this.#currentAnswerByQuestionId.get(questionId);
      if (answer !== undefined) {
        answers[questionId] = answer;
      }
    }

    return answers;
  }

  /**
   * Get validated answer of a question.
   *
   * If the question is disabled or it's answer is not valid, it's answer will be set to `undefined`.
   *
   * @param questionId question id
   * @returns validated answer
   */
  getValidatedAnswer(questionId: string) {
    return this.#validatedAnswerByQuestionId.get(questionId);
  }

  /**
   * Get validated answers.
   *
   * If a question is disabled or it's answer is not valid, it's answer will be set to `undefined`.
   *
   * You can persist it and use it with [[importAnswers]] method to restore the answers later.
   *
   * @returns validated answers
   */
  getValidatedAnswers(): Answers {
    const answers: Answers = {};

    for (const [questionId, question] of this.#questionById.entries()) {
      if (!this.#isQuestionDisabled(question)) {
        const answer = this.#validatedAnswerByQuestionId.get(questionId);
        if (answer !== undefined) {
          answers[questionId] = answer;
        }
      }
    }

    return answers;
  }

  /**
   * Get error of a question.
   *
   * If the question hasn't gone through validation, it will not have error, even if its answer is currently invalid.
   *
   * @param questionId question id
   * @returns error
   */
  getError(questionId: string) {
    return this.#errorByQuestionId.get(questionId);
  }

  /**
   * Get errors.
   *
   * Questions which didn't go through validation will not have errors, even if their answers are currently invalid.
   *
   * You can use [[validate]] method to validate all answers in the form.
   *
   * @returns errors
   */
  getErrors(): Errors {
    const errors: Errors = {};

    for (const [questionId, question] of this.#questionById.entries()) {
      if (!this.#isQuestionDisabled(question)) {
        const error = this.#errorByQuestionId.get(questionId);
        if (error !== undefined) {
          errors[questionId] = error;
        }
      }
    }

    return errors;
  }

  /**
   * Check whether form is currently being validated.
   *
   * The result might be `true` if you have async validator and the validation is not completed yet.
   *
   * @returns whether form is current being validated
   */
  isValidating() {
    for (const validating of this.#validatingByQuestionId.values()) {
      if (validating) {
        return true;
      }
    }
    return false;
  }

  /**
   * Check whether form is clean.
   *
   * Form will always be clean if it didn't go through any validation, even if there are invalid answers in the form.
   *
   * You can use [[validate]] method to validate all answers in the form.
   *
   * @returns whether form is clean
   */
  isClean(): boolean {
    for (const [questionId, error] of this.#errorByQuestionId.entries()) {
      const question = this.#findQuestion(questionId);
      if (this.#isQuestionDisabled(question)) {
        continue;
      }
      if (error) {
        return false;
      }
    }
    return true;
  }

  /**
   * Do a final round of validation and get the validated answers.
   *
   * This method will not update render instructions.
   * It is more for when you need to make sure that the form is really clean and get the final validated answers for further usage,
   * e.g. calling API, store into database, etc.
   *
   * @returns validated answer or `false` if form is not clean
   */
  async asyncValidate(): Promise<Answers | false> {
    const form = new Form(this.getConfigs(), { validators: this.#validators });
    form.importAnswers(this.getCurrentAnswers());

    while (true) {
      if (form.isValidating()) {
        await new Promise(resolve => setTimeout(resolve, 10));
      } else {
        break;
      }
    }

    if (form.isClean()) {
      return form.getValidatedAnswers();
    }
    return false;
  }

  /**
   * Validate the entire form.
   *
   * @returns whether form is clean
   */
  validate() {
    return this.#endByInformFormUpdate(() => {
      const answers = this.getCurrentAnswers();
      this.#internalImportAnswers(answers);
    });
  }

  #endByInformFormUpdate<T>(action: () => T) {
    const result = action();
    this.#informFormUpdate();
    return result;
  }

  #informFormUpdate() {
    this.#onFormUpdate?.(this);
  }

  /**
   * Validate configs.
   *
   * The following validations will be conducted:
   * - Form is not without any groups or questions
   * - No duplicated ids within the form
   * - No groups without questions
   * - No questions with `choice` or `choices` as type without choices
   * - No duplicated choice values within a question
   * - No circular choices' `onSelected` configs
   *
   * Put `strict` as `true` to validate the following:
   * - No unrecognized ids in choices' `onSelected` configs
   *
   * @param configs configs
   * @param strict strict
   * @returns validation result
   */
  static validateConfigs(configs: Configs, strict = false): ConfigsValidationResult {
    const sanitizedconfigs = sanitizeConfigs(configs);
    return new ConfigsValidator().validate(sanitizedconfigs, strict);
  }

}
