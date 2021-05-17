import Form from '.';

export type CustomConfigs = Record<string, string | number | boolean>;

export type QuestionType = 'any' | 'single' | 'multiple';

export type ChoiceValue = string | number;

export type ChoiceOnSelected = {
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

/**
 * Validation function.
 */
export type Validator = (answer: any, validation: CustomConfigs) => void | Promise<void>;

/**
 * Keys are validator name, values are [[Validator]] function.
 */
export type Validators = Record<string, Validator>;

/**
 * Keys are question id, values are answers.
 */
export type Answers = Record<string, any>;

/**
 * Keys are question id, values are error messages.
 */
export type Errors = Record<string, string>;

/**
 * Function to be called when form is updated.
 * `Form` object will be passed in.
 */
export type FormUpdateListener = (form: Form) => void | Promise<void>;
