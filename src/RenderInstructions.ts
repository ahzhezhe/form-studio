import { ChoiceValue, CustomConfig, QuestionType } from './Types';

export interface ManagebleItemRenderInstruction {
  id: string;
  disabled: boolean;
  uiConfig: CustomConfig;
}

export interface GroupRenderInstruction extends ManagebleItemRenderInstruction {
  groups: GroupRenderInstruction[];
  questions: QuestionRenderInstruction[];
}

export interface QuestionRenderInstruction extends ManagebleItemRenderInstruction {
  type: QuestionType;
  choices: ChoiceRenderInstruction[] | undefined;
  unvalidatedAnswer: any | undefined;
  validatedAnswer: any | undefined;
  error: string | undefined;
}

export interface ChoiceRenderInstruction extends ManagebleItemRenderInstruction {
  value: ChoiceValue;
  selected: boolean;
}

export type RenderInstruction = GroupRenderInstruction[];
