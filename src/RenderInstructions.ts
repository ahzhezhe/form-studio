import { ChoiceValue, CustomConfigs, QuestionType } from './Types';

/**
 * @category Render Instructions
 */
export interface ItemRenderInstructions {
  /**
   * Item id.
   */
  id: string;
  /**
   * Whether this item is disabled.
   */
  disabled: boolean;
  /**
   * Any values that help you determine how to render the frontend UI of this item.
   */
  ui: CustomConfigs;
}

/**
 * @category Render Instructions
 */
export interface GroupRenderInstructions extends ItemRenderInstructions {
  /**
   * Sub-groups.
   */
  groups: GroupRenderInstructions[];
  /**
   * Questions under this group.
   */
  questions: QuestionRenderInstructions[];
}

/**
 * @category Render Instructions
 */
export interface QuestionRenderInstructions extends ItemRenderInstructions {
  /**
   * Question type.
   *
   * For questions with `any` as type,
   * set the HTML component value using [[currentAnswer]] and use form's [[setAnswer]] method to handle `onChange` event.
   *
   * For questions with `single` as type,
   * set the HTML component value using [[currentAnswer]] and use form's [[setChoice]] or [[selectChoice]] method to handle `onChange` event.
   * Usually radio button group will be used for this question.
   *
   * For questions with `multiple` as type,
   * set the HTML component value using [[currentAnswer]] and use form's [[setChoices]] or [[selectChoice]] method to handle `onChange` event.
   * Usually check box group will be used for this question.
   */
  type: QuestionType;
  /**
   * Choices for questions with `single` or `multiple` as [[type]].
   */
  choices: ChoiceRenderInstructions[];
  /**
   * Current answer of the question. The answer is unvalidated.
   *
   * For questions with `any` as [[type]], it should be the input value.
   *
   * For questions with `single` as [[type]], it should be the value of the selected choice.
   *
   * For questions with `multiple` as [[type]], it should be a list of values of the selected choices.
   */
  currentAnswer: any | undefined;
  /**
   * Validated answer of the question.
   *
   * For questions with `any` as [[type]], it should be the input value.
   *
   * For questions with `single` as [[type]], it should be the value of the selected choice.
   *
   * For questions with `multiple` as [[type]], it should be a list of values of the selected choices.
   *
   * If the question is disabled or the answer is not valid, the answer will be set to `undefined`.
   */
  validatedAnswer: any | undefined;
  /**
   * Whether question is currently being validating.
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
export interface ChoiceRenderInstructions extends ItemRenderInstructions {
  /**
   * Value of this choice. It will be used as answer of the question.
   */
  value: ChoiceValue;
}

/**
 * Instructions to be used for rendering frontend UI.
 *
 * @category Render Instructions
 */
export type RenderInstructions = GroupRenderInstructions[];
