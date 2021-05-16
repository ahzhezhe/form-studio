import { ChoiceOnSelected, ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemConfig {
  id: string;
  order: number | undefined;
  defaultDisabled: boolean;
  ui: CustomConfig;
}

export interface GroupConfig extends ManagebleItemConfig {
  groups: GroupConfig[];
  questions: QuestionConfig[];
}

export interface QuestionConfig extends ManagebleItemConfig {
  type: QuestionType;
  choices: ChoiceConfig[];
  validator: string | undefined;
  validation: CustomConfig;
  defaultAnswer: any;
}

export interface ChoiceConfig extends ManagebleItemConfig {
  value: ChoiceValue;
  onSelected: ChoiceOnSelected;
}

/**
 * Form configs.
 */
export type Configs = GroupConfig[];
