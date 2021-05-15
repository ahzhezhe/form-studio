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
  inputValue: any | undefined;
  choices: ChoiceRenderInstruction[] | undefined;
  answer: any | undefined;
  error: string | undefined;
}

export interface ChoiceRenderInstruction extends ManagebleItemRenderInstruction {
  value: ChoiceValue;
  selected: boolean;
}

export type RenderInstruction = GroupRenderInstruction[];
