import { ConfigType, QuestionType } from './Types';

export interface ManagebleItemTemplate {
  id: string;
  disabled: boolean;
  uiConfig: ConfigType;
}

export interface GroupTemplate extends ManagebleItemTemplate {
  groups: GroupTemplate[];
  questions: QuestionTemplate[];
}

export interface QuestionTemplate extends ManagebleItemTemplate {
  type: QuestionType;
  inputType: string | undefined;
  inputValue: any | undefined;
  choices: ChoiceTemplate[] | undefined;
  answer: any | undefined;
  error: string | undefined;
}

export interface ChoiceTemplate extends ManagebleItemTemplate {
  value: string;
  selected: boolean;
}

export type Template = GroupTemplate[];
