import { ConfigType, QuestionType } from './Types';

export interface ManagebleItem {
  id: string;
  order: number | undefined;
  disabled: boolean;
  uiConfig: ConfigType;
}

export interface Group extends ManagebleItem {
  groups: Group[];
  questions: Question[];
}

export interface Question extends ManagebleItem {
  type: QuestionType;
  inputType: string | undefined;
  choices: Choice[] | undefined;
  validation: ConfigType;
}

export interface Choice extends ManagebleItem {
  value: string;
}
