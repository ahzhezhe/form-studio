import { ChoiceOnSelected, ChoiceValue, CustomConfigs, QuestionType } from './Types';

export interface Item {
  id: string;
  order: number | undefined;
  defaultDisabled: boolean;
  ui: CustomConfigs;
}

export interface Group extends Item {
  groups: Group[];
  questions: Question[];
}

export interface Question extends Item {
  type: QuestionType;
  choices: Choice[];
  validator: string | undefined;
  validation: CustomConfigs;
  defaultAnswer: any;
}

export interface Choice extends Item {
  value: ChoiceValue;
  onSelected: ChoiceOnSelected;
}
