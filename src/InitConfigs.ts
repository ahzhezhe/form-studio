import { ChoiceOnSelected, ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemInitConfig {
  id?: string;
  order?: number;
  disabled?: boolean;
  ui?: CustomConfig;
}

export interface GroupInitConfig extends ManagebleItemInitConfig {
  groups?: GroupInitConfig[];
  questions?: QuestionInitConfig[];
}

export interface QuestionInitConfig extends ManagebleItemInitConfig {
  type: QuestionType;
  choices?: ChoiceInitConfig[];
  validatorKey?: string;
  validation?: CustomConfig;
}

export interface ChoiceInitConfig extends ManagebleItemInitConfig {
  value?: ChoiceValue;
  onSelected?: ChoiceOnSelected;
}

export type InitConfigs = GroupInitConfig[];
