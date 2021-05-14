import { ConfigType, QuestionType } from './Types';

export const managebleItemSorter = (a: ManagebleItemConfig, b: ManagebleItemConfig) => {
  if (!!!a.order && !!!b.order) {
    return 0;
  }
  if (!!!b.order) {
    return -1;
  }
  if (!!!a.order) {
    return 1;
  }
  return a.order - b.order;
};

export interface ManagebleItemConfig {
  id?: string;
  order?: number;
  disabled?: boolean;
  optional?: boolean;
  uiConfig?: ConfigType;
}

export interface GroupConfig extends ManagebleItemConfig {
  groups?: GroupConfig[];
  questions?: QuestionConfig[];
}

export interface QuestionConfig extends ManagebleItemConfig {
  type: QuestionType;
  input?: InputConfig;
  choices?: ChoiceConfig[];
  validation?: ConfigType;
}

export interface InputConfig extends ManagebleItemConfig {
  type: string;
  validation?: ConfigType;
}

export interface ChoiceConfig extends ManagebleItemConfig {
  value: string;
}

export type Config = GroupConfig[];
