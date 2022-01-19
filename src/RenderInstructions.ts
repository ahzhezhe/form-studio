import { QuestionType } from './Types';

/**
 * @category Render Instructions
 */
export interface ItemRenderInstructions<Custom = any> {
  /**
   * Item id.
   */
  id: string;
  /**
   * Whether or not this item is disabled.
   */
  disabled: boolean;
  /**
   * Any values that help you determine how to render the frontend UI.
   */
  custom: Custom;
}

/**
 * @category Render Instructions
 */
export interface GroupRenderInstructions<Custom = any> extends ItemRenderInstructions<Custom> {
  /**
   * Whether or not there are questions in this group that are currently being validated.
   *
   * This value can be `true` if the validator used is an aysnc function.
   */
  validating: boolean;
  /**
   * Sub-groups.
   */
  groups: GroupRenderInstructions<Custom>[];
  /**
   * Questions under this group.
   */
  questions: QuestionRenderInstructions<Custom>[];
}

/**
 * @category Render Instructions
 */
export interface QuestionRenderInstructions<Custom = any> extends ItemRenderInstructions<Custom> {
  /**
   * Question type.
   *
   * For questions with `any` as type,
   * set the HTML component value using [[currentAnswer]] and use form's [[setAnswer]] method to handle `onChange` event.
   *
   * For questions with `choice` as type,
   * set the HTML component value using [[currentAnswer]] and use form's [[setChoice]] or [[selectChoice]] method to handle `onChange` event.
   * Usually radio button group or dropdown select will be used for this type of questions.
   *
   * For questions with `choices` as type,
   * set the HTML component value using [[currentAnswer]] and use form's [[setChoices]] or [[selectChoice]] method to handle `onChange` event.
   * Usually checkbox group or select with multiple mode turned on will be used for this type of questions.
   */
  type: QuestionType;
  /**
   * Choices for questions with `choice` or `choices` as [[type]].
   */
  choices: ChoiceRenderInstructions<Custom>[];
  /**
   * Current answer of the question. The answer is unvalidated.
   *
   * For questions with `any` as [[type]], it should be the input value.
   *
   * For questions with `choice` as [[type]], it should be the value of the selected choice.
   *
   * For questions with `choices` as [[type]], it should be a list of values of the selected choices.
   */
  currentAnswer: any;
  /**
   * Validated answer of the question.
   *
   * For questions with `any` as [[type]], it should be the input value.
   *
   * For questions with `choice` as [[type]], it should be the value of the selected choice.
   *
   * For questions with `choices` as [[type]], it should be a list of values of the selected choices.
   *
   * If the question is disabled or the answer is not valid, the answer will be set to `undefined`.
   */
  validatedAnswer: any;
  /**
   * Whether or not the question is currently being validated.
   *
   * This value can be `true` if the validator used is an aysnc function.
   */
  validating: boolean;
  /**
   * Error thrown by validator.
   */
  error: any;
}

/**
 * @category Render Instructions
 */
export interface ChoiceRenderInstructions<Custom = any> extends ItemRenderInstructions<Custom> {
  /**
   * Value of this choice. It will be used as answer of the question.
   */
  value: any;
}

/**
 * Instructions to be used for rendering frontend UI.
 *
 * @category Render Instructions
 */
export interface RenderInstructions<Custom = any> {
  /**
   * Whether or not there are questions in the form that are currently being validated.
   *
   * This value can be `true` if the validator used is an aysnc function.
   */
  validating: boolean;
  /**
   * Groups.
   */
  groups: GroupRenderInstructions<Custom>[];
  /**
   * Questions directly under the form, without grouping.
   */
  questions: QuestionRenderInstructions<Custom>[];
}
