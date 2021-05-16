import { ChoiceOnSelected, ChoiceValue, CustomConfigs, QuestionType } from './Types';

/**
 * @category Exported Configs
 */
export interface ExportedItemConfigs {
  id: string;
  order: number | undefined;
  defaultDisabled: boolean;
  ui: CustomConfigs;
}

/**
 * @category Exported Configs
 */
export interface ExportedGroupConfigs extends ExportedItemConfigs {
  groups: ExportedGroupConfigs[];
  questions: ExportedQuestionConfigs[];
}

/**
 * @category Exported Configs
 */
export interface ExportedQuestionConfigs extends ExportedItemConfigs {
  type: QuestionType;
  choices: ExportedChoiceConfigs[];
  validator: string | undefined;
  validation: CustomConfigs;
  defaultAnswer: any;
}

/**
 * @category Exported Configs
 */
export interface ExportedChoiceConfigs extends ExportedItemConfigs {
  value: ChoiceValue;
  onSelected: ChoiceOnSelected;
}

/**
 * Exported form configs.
 * You can persist it and use it with [[fromConfigs]] method to reinitiate the form later.
 *
 * @category Exported Configs
 */
export type ExportedConfigs = ExportedGroupConfigs[];
