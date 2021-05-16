import { ChoiceOnSelected, ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemInitConfig {
  /**
   * Item id.
   * It should be unique throughout the entire form.
   * It will be auto generated if you leave it `undefined`.
   */
  id?: string;
  /**
   * Item sort order.
   * Items will be sorted by their positions in the list if their order is `undefined`.
   */
  order?: number;
  /**
   * Whether this item is disabled by default.
   * The actual disabled property will be based on the logic that you define in other part of the configs.
   */
  defaultDisabled?: boolean;
  /**
   * Any values that help you determine how to render the frontend UI of this item.
   */
  ui?: CustomConfig;
}

export interface GroupInitConfig extends ManagebleItemInitConfig {
  /**
   * Sub-groups.
   */
  groups?: GroupInitConfig[];
  /**
   * Questions under this group.
   */
  questions?: QuestionInitConfig[];
}

export interface QuestionInitConfig extends ManagebleItemInitConfig {
  /**
   * Question type.
   *
   * Questions with `input` as type accept `any` as value.
   * You shouldn't have to specify `choices` for this question.
   *
   * Questions with `single` as type accept `ChoiceValue` as value.
   * You should specify `choices` for this question.
   * Usually radio button group will be used for this question.
   *
   * Questions with `multiple` as type accept `ChoiceValue[]` as value.
   * You should specify `choices` for this question.
   * Usually check box group will be used for this question.
   */
  type: QuestionType;
  /**
   * Choices for questions with `single` or `multiple` as type.
   */
  choices?: ChoiceInitConfig[];
  /**
   * Name of the validator to be used for validation when answer of this question is changed.
   */
  validator?: string;
  /**
   * Any values that help to validator to perform validation.
   */
  validation?: CustomConfig;
  /**
   * Default answer.
   *
   * Questions with `input` as type accept `any` as value.
   *
   * Questions with `single` as type accept `ChoiceValue` as value.
   *
   * Questions with `multiple` as type accept `ChoiceValue[]` as value.
   */
  defaultAnswer?: any;
}

export interface ChoiceInitConfig extends ManagebleItemInitConfig {
  /**
   * Value of this choice. It will be used as answer of the question.
   * Id will be used as value if you leave it `undefined`.
   */
  value?: ChoiceValue;
  /**
   * Actions to be performed when this choice is toggled.
   */
  onSelected?: ChoiceOnSelected;
}

/**
 * Configs to initiate a form.
 */
export type InitConfigs = GroupInitConfig[];
