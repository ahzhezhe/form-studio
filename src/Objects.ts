import { ConfigType, QuestionType } from './Types';

export interface ManagebleItem {
  id: string;
  disabled: boolean;
  optional: boolean;
  uiConfig: ConfigType | undefined;
}

export interface Group extends ManagebleItem {
  groups: Group[];
  questions: Question[];
}

export interface Question extends ManagebleItem {
  type: QuestionType;
  input?: Input;
  choices?: Choice[];
  validation: ConfigType | undefined;
}

export interface Input extends ManagebleItem {
  type: string;
  validation: ConfigType | undefined;
}

export interface Choice extends ManagebleItem {
  value: string;
}
