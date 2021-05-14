import { ConfigType, QuestionType } from './Types';

export interface ManagebleItem {
  id: string;
  disabled: boolean;
  uiConfig: ConfigType | undefined;
}

export interface Group extends ManagebleItem {
  groups: Group[];
  questions: Question[];
}

export interface Question extends ManagebleItem {
  type: QuestionType;
  inputType: string | undefined;
  choices: Choice[] | undefined;
  validation: ConfigType | undefined;
}

export interface Choice extends ManagebleItem {
  value: string;
}
