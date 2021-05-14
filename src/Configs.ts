import { ConfigType, QuestionType } from './Types';

export interface ManagebleItemConfig {
  id: string;
  order: number | undefined;
  disabled: boolean;
  uiConfig: ConfigType;
}

export interface GroupConfig extends ManagebleItemConfig {
  groups: GroupConfig[];
  questions: QuestionConfig[];
}

export interface QuestionConfig extends ManagebleItemConfig {
  type: QuestionType;
  inputType?: string;
  choices?: ChoiceConfig[];
  validation: ConfigType;
}

export interface ChoiceConfig extends ManagebleItemConfig {
  value: string;
}

export type Config = GroupConfig[];
