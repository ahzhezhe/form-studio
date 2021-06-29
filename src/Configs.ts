import { ChoiceOnSelected, QuestionType } from './Types';

/**
 * @category Configs
 */
export interface ItemConfigs {
  /**
   * Item id.
   *
   * It should be unique throughout the entire form.
   *
   * It will be auto generated if you leave it falsy.
   */
  id?: string;
  /**
   * Whether or not this item is disabled by default.
   */
  defaultDisabled?: boolean;
  /**
   * Any values that help you determine on how to render the frontend UI or how to perform validation.
   */
  custom?: any;
}

/**
 * @category Configs
 */
export interface GroupConfigs extends ItemConfigs {
  /**
   * Sub-groups.
   */
  groups?: GroupConfigs[];
  /**
   * Questions under this group.
   */
  questions?: QuestionConfigs[];
}

/**
 * @category Configs
 */
export interface QuestionConfigs extends ItemConfigs {
  /**
   * Question type.
   *
   * Questions with `any` as [[type]] accept `any` as answer.
   * You shouldn't have to specify [[choices]] for this question.
   *
   * Questions with `choice` as [[type]] accept `any` as answer.
   * You should specify [[choices]] for this question.
   * Usually radio button group or dropdown select will be used for this type of questions.
   *
   * Questions with `choices` as [[type]] accept `any`[] as answer.
   * You should specify [[choices]] for this question.
   * Usually checkbox group or select with multiple mode turned on will be used for this type of questions.
   */
  type: QuestionType;
  /**
   * Choices for questions with `choice` or `choices` as [[type]].
   */
  choices?: ChoiceConfigs[];
  /**
   * Names of the validators to be used for validation when answer of this question is changed.
   *
   * Validators will be executed in sequence of their positions in the list.
   */
  validators?: string[];
  /**
   * Default answer.
   *
   * Questions with `any` as [[type]] accept `any` as answer.
   *
   * Questions with `choice` as [[type]] accept `any` as answer.
   *
   * Questions with `choices` as [[type]] accept `any`[] as answer.
   */
  defaultAnswer?: any;
}

/**
 * @category Configs
 */
export interface ChoiceConfigs extends ItemConfigs {
  /**
   * Value of this choice. It will be used as answer of the question.
   *
   * Using primitive type like `string` or `number` is recommended due to the limitation in comparing complex value.
   *
   * Id will be used as value if you leave it `undefined`.
   */
  value?: any;
  /**
   * Actions to be performed when this choice is toggled.
   */
  onSelected?: ChoiceOnSelected;
}

/**
 * Configs to construct a form.
 *
 * @category Configs
 */
export type Configs = {
  /**
   * Groups.
   */
  groups?: GroupConfigs[];
  /**
   * Questions directly under the form, without grouping.
   */
  questions?: QuestionConfigs[];
};
