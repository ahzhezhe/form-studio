import { ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItem {
  id: string;
  order: number | undefined;
  disabled: boolean;
  uiConfig: CustomConfig;
}

export interface Group extends ManagebleItem {
  groups: Group[];
  questions: Question[];
}

export interface Question extends ManagebleItem {
  type: QuestionType;
  choices: Choice[] | undefined;
  validatorKey: string | undefined;
  validationConfig: CustomConfig;
}

export interface Choice extends ManagebleItem {
  value: ChoiceValue;
}
