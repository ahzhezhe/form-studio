import { Question } from './ExportedConfigs';
import { Form } from './Form';

export type QuestionType = 'any' | 'choice' | 'choices';

/**
 * A list of choice id.
 *
 * - []               - Always
 * - [[]]             - Always
 * - [A]              - When A is selected
 * - [A, B]           - When A OR B is selected
 * - [[A, B]]         - When A AND B are selected
 * - [[A, B], C]      - When (A AND B) OR just C is selected
 * - [[A, B], [C, D]] - When (A AND B) OR (C AND D) are selected
 */
export type ItemAbledWhen = string[][];

export type ChoiceOnSelected = {
  /**
   * A list of group id, question id or choice id.
   *
   * They will be disabled when this choice is selected and enabled when this choice is unselected.
   */
  disable?: string[];
  /**
   * A list of group id, question id or choice id.
   *
   * They will be enabled when this choice is selected and disabled when this choice is unselected.
   */
  enable?: string[];
}

/**
 * Validation function.
 */
export type Validator = (answer: any, question: Question, previousAnswer: any, form: Form) => void | Promise<void>;

/**
 * Keys are validator names, values are [[Validator]] functions.
 */
export type Validators = Record<string, Validator>;

/**
 * Keys are question ids, values are answers.
 */
export type Answers = Record<string, any>;

/**
 * Keys are question ids, values are errors thrown by validators.
 */
export type Errors = Record<string, any>;

/**
 * Function to be called when form is updated.
 */
export type FormUpdateListener = (form: Form) => void | Promise<void>;

export type ConfigsValidationResult = {
  /**
   * Whether or not the configs is valid.
   */
  valid: boolean;
  /**
   * Errors of invalid configs.
   *
   * Keys are group / question / choice ids, values are error messages.
   *
   * If key is an empty string, that means the error is related to the form itself.
   */
  errors?: Record<string, string[]>;
}
