export type CustomConfig = Record<string, string | number | boolean>;

export type QuestionType = 'input' | 'single' | 'multiple';

export type ChoiceValue = string | number;

export interface ChoiceOnSelected {
  /**
   * A list of group id, question id or choice id.
   * They will be disabled when this choice is selected and enabled when this choice is unselected.
   */
  disable?: string[];
  /**
   * A list of group id, question id or choice id.
   * They will be enabled when this choice is selected and disabled when this choice is unselected.
   */
  enable?: string[];
}

export type Validator = (value: any, validation: CustomConfig) => void | Promise<void>;

export type Answers = Record<string, any>;

export type Errors = Record<string, string>;

export type FormRefreshedHook = () => void | Promise<void>;
