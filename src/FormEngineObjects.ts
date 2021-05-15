import { ChoiceOnSelected, ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItem {
  id: string;
  order: number | undefined;
  disabled: boolean;
  ui: CustomConfig;
}

export interface Group extends ManagebleItem {
  groups: Group[];
  questions: Question[];
}

export interface Question extends ManagebleItem {
  type: QuestionType;
  choices: Choice[] | undefined;
  validatorKey: string | undefined;
  validation: CustomConfig;
}

export interface Choice extends ManagebleItem {
  value: ChoiceValue;
  onSelected: ChoiceOnSelected;
}
