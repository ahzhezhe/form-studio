export type CustomConfig = Record<string, string | number | boolean>;

export type QuestionType = 'input' | 'single' | 'multiple';

export type ChoiceValue = string | number;

export interface ChoiceOnSelected {
  disable?: string[];
  enable?: string[];
}

export type Validator = (value: any, validation: CustomConfig) => void | Promise<void>;

export type Answers = Record<string, any>;

export type Errors = Record<string, string>;

export type FormRefreshedHook = () => void | Promise<void>;
