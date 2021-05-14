import { ConfigType, QuestionType } from './Types';

export const managebleItemSorter = (a: ManagebleItemInitConfig, b: ManagebleItemInitConfig) => {
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

export interface ManagebleItemInitConfig {
  id?: string;
  order?: number;
  disabled?: boolean;
  uiConfig?: ConfigType;
}

export interface GroupInitConfig extends ManagebleItemInitConfig {
  groups?: GroupInitConfig[];
  questions?: QuestionInitConfig[];
}

export interface QuestionInitConfig extends ManagebleItemInitConfig {
  type: QuestionType;
  inputType?: string;
  choices?: ChoiceInitConfig[];
  validation?: ConfigType;
}

export interface ChoiceInitConfig extends ManagebleItemInitConfig {
  value: string;
}

export type InitConfig = GroupInitConfig[];
