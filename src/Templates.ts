import { ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemTemplate {
  id: string;
  disabled: boolean;
  uiConfig: CustomConfig;
}

export interface GroupTemplate extends ManagebleItemTemplate {
  groups: GroupTemplate[];
  questions: QuestionTemplate[];
}

export interface QuestionTemplate extends ManagebleItemTemplate {
  type: QuestionType;
  inputValue: any | undefined;
  choices: ChoiceTemplate[] | undefined;
  answer: any | undefined;
  error: string | undefined;
}

export interface ChoiceTemplate extends ManagebleItemTemplate {
  value: ChoiceValue;
  selected: boolean;
}

export type Template = GroupTemplate[];
