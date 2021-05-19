import { ChoiceOnSelected, CustomConfigs, QuestionType } from './Types';

export interface Item {
  id: string;
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
  validators: string[];
  validation: CustomConfigs;
  defaultAnswer: any;
}

export interface Choice extends Item {
  value: any;
  onSelected: ChoiceOnSelected;
}
