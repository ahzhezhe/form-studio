import { ChoiceOnSelected, QuestionType } from './Types';

/**
 * @category Exported Configs
 */
export interface Item {
  id: string;
  defaultDisabled: boolean;
  custom: any;
}

/**
 * @category Exported Configs
 */
export interface Group extends Item {
  groups: Group[];
  questions: Question[];
}

/**
 * @category Exported Configs
 */
export interface Question extends Item {
  type: QuestionType;
  choices: Choice[];
  validators: string[];
  defaultAnswer: any;
}

/**
 * @category Exported Configs
 */
export interface Choice extends Item {
  value: any;
  onSelected: ChoiceOnSelected;
}

/**
 * Exported form configs.
 *
 * You can persist it and use it to reconstruct the form later.
 *
 * @category Exported Configs
 */
export type ExportedConfigs = {
  groups: Group[];
  questions: Question[];
};
