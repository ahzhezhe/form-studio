export type CustomConfig = Record<string, string | number | boolean>;

export type QuestionType = 'input' | 'singleChoice' | 'multiChoice';

export type ChoiceValue = string | number;

export type Validator = (value: any, validationConfig: CustomConfig) => void | Promise<void>;

export type Answers = Record<string, any>;
