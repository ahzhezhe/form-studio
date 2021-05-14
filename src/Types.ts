export type ConfigType = Record<string, string | number | boolean>;

export type QuestionType = 'input' | 'singleChoice' | 'multiChoice';

export type Validator = (value: any, validation: ConfigType) => void | Promise<void>;

export type Answers = Record<string, any>;
