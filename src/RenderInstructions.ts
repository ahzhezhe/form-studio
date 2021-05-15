import { ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemRenderInstruction {
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
  ui: CustomConfig;
}

export interface GroupRenderInstruction extends ManagebleItemRenderInstruction {
  /**
   * Sub-groups.
   */
  groups: GroupRenderInstruction[];
  /**
   * Questions under this group.
   */
  questions: QuestionRenderInstruction[];
}

export interface QuestionRenderInstruction extends ManagebleItemRenderInstruction {
  /**
   * Question type.
   *
   * For questions with `input` as type,
   * set the HTML component value using `unvalidatedAnswer` and use form's `setInput` method to handle `onChange` event.
   *
   * For questions with `single` as type,
   * set the HTML component value using `unvalidatedAnswer` and use form's `setChoice` or `selectChoice` method to handle `onChange` event.
   * Usually radio button group will be used for this question.
   *
   * For questions with `multiple` as type,
   * set the HTML component value using `unvalidatedAnswer` and use form's `setChoices` or `selectChoice` method to handle `onChange` event.
   * Usually check box group will be used for this question.
   */
  type: QuestionType;
  /**
   * Choices for questions with `single` or `multiple` as type.
   */
  choices: ChoiceRenderInstruction[];
  /**
   * Unvalidated answer of the question.
   *
   * For questions with `input` as type, it should be the input value.
   *
   * For questions with `single` as type, it should be the value of the selected choice.
   *
   * For questions with `multiple` as type, it should be a list of values of the selected choices.
   */
  unvalidatedAnswer: any | undefined;
  /**
   * Validated answer of the question.
   *
   * For questions with `input` as type, it should be the input value.
   *
   * For questions with `single` as type, it should be the value of the selected choice.
   *
   * For questions with `multiple` as type, it should be a list of values of the selected choices.
   *
   * If the question is disabled or the answer is not valid, the answer will be set to `undefined`.
   */
  validatedAnswer: any | undefined;
  /**
   * Message of the error thrown by validator.
   */
  error: string | undefined;
}

export interface ChoiceRenderInstruction extends ManagebleItemRenderInstruction {
  /**
   * Value of this choice. It will be used as answer of the question.
   */
  value: ChoiceValue;
  /**
   * Whether this choice is selected.
   */
  selected: boolean;
}

/**
 * Instructions to be used for rendering frontend UI.
 */
export type RenderInstructions = GroupRenderInstruction[];
