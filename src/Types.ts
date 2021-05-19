import { Question } from './ExportedConfigs';
import Form from '.';

export type QuestionType = 'any' | 'choice' | 'choices';

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
export type Validator = (answer: any, question: Question) => void | Promise<void>;

/**
 * Keys are validator name, values are [[Validator]] function.
 */
export type Validators = Record<string, Validator>;

/**
 * Keys are question id, values are answers.
 */
export type Answers = Record<string, any>;

/**
 * Keys are question id, values are error thrown by validator.
 */
export type Errors = Record<string, any>;

/**
 * Function to be called when form is updated.
 * `Form` object will be passed in.
 */
export type FormUpdateListener = (form: Form) => void | Promise<void>;

export type ConfigsValidationResult = {
  /**
   * Whether or not the configs is valid.
   */
  pass: boolean;
  /**
   * Errors of invalid configs.
   *
   * Keys are group / question / choice ids, values are error messages.
   * If key is an empty string, that means the error is related to the form itself.
   */
  errors?: Record<string, string[]>;
}
