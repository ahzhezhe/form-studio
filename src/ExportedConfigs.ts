import { ChoiceOnSelected, ItemAbledOnSelected, QuestionType } from './Types';

/**
 * @category Exported Configs
 */
export interface Item<Custom = any> {
  id: string;
  defaultDisabled: boolean;
  enabledOnSelected?: ItemAbledOnSelected;
  disabledOnSelected?: ItemAbledOnSelected;
  custom: Custom;
}

/**
 * @category Exported Configs
 */
export interface Group<Custom = any> extends Item<Custom> {
  groups: Group<Custom>[];
  questions: Question<Custom>[];
}

/**
 * @category Exported Configs
 */
export interface Question<Custom = any> extends Item<Custom> {
  type: QuestionType;
  choices: Choice<Custom>[];
  validators: string[];
  defaultAnswer: any;
}

/**
 * @category Exported Configs
 */
export interface Choice<Custom = any> extends Item<Custom> {
  value: any;
  /**
   * @deprecated
   */
  onSelected?: ChoiceOnSelected;
}

/**
 * Exported form configs.
 *
 * You can persist it and use it to reconstruct the form later.
 *
 * @category Exported Configs
 */
export type ExportedConfigs<Custom = any> = {
  groups: Group<Custom>[];
  questions: Question<Custom>[];
};
