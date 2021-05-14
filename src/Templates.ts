import { ConfigType, QuestionType } from './Types';

export interface ManagebleItemTemplate {
  id: string;
  disabled: boolean;
  optional: boolean;
  uiConfig: ConfigType | undefined;
}

export interface GroupTemplate extends ManagebleItemTemplate {
  groups: GroupTemplate[];
  questions: QuestionTemplate[];
}

export interface QuestionTemplate extends ManagebleItemTemplate {
  type: QuestionType;
  input?: InputTemplate;
  choices?: ChoiceTemplate[];
  answer: any | undefined;
  error: string | undefined;
}

export interface InputTemplate extends ManagebleItemTemplate {
  type: string;
  value: any | undefined;
  error: string | undefined;
}

export interface ChoiceTemplate extends ManagebleItemTemplate {
  value: string;
  selected: boolean;
  error: string | undefined;
}

export type Template = GroupTemplate[];
