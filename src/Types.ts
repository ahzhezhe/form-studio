export type CustomConfig = Record<string, string | number | boolean>;

export type QuestionType = 'input' | 'single' | 'multiple';

export type ChoiceValue = string | number;

export type Validator = (value: any, validationConfig: CustomConfig) => void | Promise<void>;

export type Answers = Record<string, any>;

export interface ChoiceOnChange {
  disable?: string[];
  enable?: string[];
}
