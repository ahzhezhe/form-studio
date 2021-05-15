import { ChoiceOnSelected, ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemConfig {
  id: string;
  order: number | undefined;
  disabled: boolean;
  uiConfig: CustomConfig;
}

export interface GroupConfig extends ManagebleItemConfig {
  groups: GroupConfig[];
  questions: QuestionConfig[];
}

export interface QuestionConfig extends ManagebleItemConfig {
  type: QuestionType;
  choices: ChoiceConfig[] | undefined;
  validatorKey: string | undefined;
  validationConfig: CustomConfig;
}

export interface ChoiceConfig extends ManagebleItemConfig {
  value: ChoiceValue;
  onSelected: ChoiceOnSelected;
}

export type Configs = GroupConfig[];
