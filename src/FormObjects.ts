import { ChoiceOnSelected, ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItem {
  id: string;
  order: number | undefined;
  defaultDisabled: boolean;
  ui: CustomConfig;
}

export interface Group extends ManagebleItem {
  groups: Group[];
  questions: Question[];
}

export interface Question extends ManagebleItem {
  type: QuestionType;
  choices: Choice[];
  validator: string | undefined;
  validation: CustomConfig;
  defaultAnswer: any;
}

export interface Choice extends ManagebleItem {
  value: ChoiceValue;
  onSelected: ChoiceOnSelected;
}
