import { ChoiceOnChange, ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemInitConfig {
  id?: string;
  order?: number;
  disabled?: boolean;
  uiConfig?: CustomConfig;
}

export interface GroupInitConfig extends ManagebleItemInitConfig {
  groups?: GroupInitConfig[];
  questions?: QuestionInitConfig[];
}

export interface QuestionInitConfig extends ManagebleItemInitConfig {
  type: QuestionType;
  choices?: ChoiceInitConfig[];
  validatorKey?: string;
  validationConfig?: CustomConfig;
}

export interface ChoiceInitConfig extends ManagebleItemInitConfig {
  value?: ChoiceValue;
  onChange?: ChoiceOnChange;
}

export type InitConfig = GroupInitConfig[];
