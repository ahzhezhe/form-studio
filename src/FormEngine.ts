import shortUUID from 'short-uuid';
import { Config, GroupConfig, QuestionConfig, managebleItemSorter, InputConfig, ChoiceConfig } from './Configs';
import { Choice, Group, Input, Question } from './Objects';
import { ChoiceTemplate, GroupTemplate, InputTemplate, QuestionTemplate, Template } from './Templates';
import { ConfigType } from './Types';

export type Validator = (value: any, validation?: ConfigType) => void | Promise<void>;

export class FormEngine {

  private validators?: Record<string, Validator>;
  private groups: Group[];
  private groupMap = new Map<string, Group>();
  private questionMap = new Map<string, Question>();
  private inputMap = new Map<string, Input>();
  private choiceMap = new Map<string, Choice>();
  private questionInputMap = new Map<string, Input>();
  private questionChoicesMap = new Map<string, Choice[]>();
  private optionQuestionMap = new Map<string, Question>();
  private optionValueMap = new Map<string, any>();
  private optionErrorMap = new Map<string, string>();
  private questionAnswerMap = new Map<string, any>();
  private questionErrorMap = new Map<string, string>();

  private constructor(groups: Group[], validators?: Record<string, Validator>) {
    this.validators = validators;
    this.groups = groups;
    this.constructGroupMap(this.groups);
  }

  private constructGroupMap(groups: Group[]) {
    groups.forEach(group => {
      this.groupMap.set(group.id!, group);
      this.constructGroupMap(group.groups || []);
      this.constructQuestionMap(group.questions || []);
    });
  }

  private constructQuestionMap(questions: Question[]) {
    questions.forEach(question => {
      this.questionMap.set(question.id!, question);
      if (question.type === 'input') {
        this.questionInputMap.set(question.id!, question.input!);
        this.constructInputMap(question, question.input!);
      } else {
        this.questionChoicesMap.set(question.id!, question.choices!);
        this.constructChoiceMap(question, question.choices!);
      }
    });
  }

  private constructInputMap(parent: Question, input: Input) {
    this.inputMap.set(input.id!, input);
    this.optionQuestionMap.set(input.id!, parent);
  }

  private constructChoiceMap(parent: Question, choices: Choice[]) {
    choices.forEach(choice => {
      this.choiceMap.set(choice.id!, choice);
      this.optionQuestionMap.set(choice.id!, parent);
    });
  }

  static fromConfig(config: Config, validators?: Record<string, Validator>) {
    const groups = this.fromGroupConfig(config);
    return new FormEngine(groups, validators);
  }

  private static fromGroupConfig(groups: GroupConfig[]): Group[] {
    return groups.sort(managebleItemSorter).map((group): Group => ({
      id: group.id || shortUUID.generate(),
      disabled: !!group.disabled,
      optional: !!group.optional,
      uiConfig: group.uiConfig,
      groups: group.groups ? this.fromGroupConfig(group.groups) : [],
      questions: group.questions ? this.fromQuestionConfig(group.questions) : []
    }));
  }

  private static fromQuestionConfig(questions: QuestionConfig[]): Question[] {
    return questions.sort(managebleItemSorter).map((question): Question => ({
      id: question.id || shortUUID.generate(),
      disabled: !!question.disabled,
      optional: !!question.optional,
      uiConfig: question.uiConfig,
      type: question.type,
      input: question.type === 'input' ? this.fromInputConfig(question.input!) : undefined,
      choices: question.type !== 'input' ? this.fromChoiceConfig(question.choices!) : undefined,
      validation: question.validation
    }));
  }

  private static fromInputConfig(input: InputConfig): Input {
    return {
      id: input.id || shortUUID.generate(),
      disabled: !!input.disabled,
      optional: !!input.optional,
      uiConfig: input.uiConfig,
      type: input.type,
      validation: input.validation
    };
  }

  private static fromChoiceConfig(choices: ChoiceConfig[]): Choice[] {
    return choices.sort(managebleItemSorter).map((choice): Choice => ({
      id: choice.id || shortUUID.generate(),
      disabled: !!choice.disabled,
      optional: !!choice.optional,
      uiConfig: choice.uiConfig,
      value: choice.value
    }));
  }

  toTemplate(): Template {
    return this.toGroupTemplate(this.groups);
  }

  private toGroupTemplate(groups: Group[]): GroupTemplate[] {
    return groups.map((group): GroupTemplate => ({
      id: group.id,
      disabled: group.disabled,
      optional: group.optional,
      uiConfig: group.uiConfig,
      groups: this.toGroupTemplate(group.groups),
      questions: this.toQuestionTemplate(group.questions)
    }));
  }

  private toQuestionTemplate(questions: Question[]): QuestionTemplate[] {
    return questions.map((question): QuestionTemplate => ({
      id: question.id,
      disabled: question.disabled,
      optional: question.optional,
      uiConfig: question.uiConfig,
      type: question.type,
      input: question.type === 'input' ? this.toInputTemplate(question.input!) : undefined,
      choices: question.type !== 'input' ? this.toChoiceTemplate(question.choices!) : undefined,
      answer: this.questionAnswerMap.get(question.id),
      error: this.questionErrorMap.get(question.id)
    }));
  }

  private toInputTemplate(input: Input): InputTemplate {
    return {
      id: input.id,
      disabled: input.disabled,
      optional: input.optional,
      uiConfig: input.uiConfig,
      type: input.type,
      value: this.optionValueMap.get(input.id),
      error: this.optionErrorMap.get(input.id)
    };
  }

  private toChoiceTemplate(choices: Choice[]): ChoiceTemplate[] {
    return choices.map((choice): ChoiceTemplate => ({
      id: choice.id,
      disabled: choice.disabled,
      optional: choice.optional,
      uiConfig: choice.uiConfig,
      value: choice.value,
      selected: !!this.optionValueMap.get(choice.id),
      error: this.optionErrorMap.get(choice.id)
    }));
  }

  private findGroup(groupId: string) {
    const group = this.groupMap.get(groupId);
    if (!group) {
      throw new Error('Croup is not found.');
    }
    return group;
  }

  private findQuestion(questionId: string) {
    const question = this.questionMap.get(questionId);
    if (!question) {
      throw new Error('Question is not found.');
    }
    return question;
  }

  private findInput(inputId: string) {
    const input = this.inputMap.get(inputId);
    if (!input) {
      throw new Error('Input is not found.');
    }
    return input;
  }

  private findChoice(choiceId: string) {
    const choice = this.choiceMap.get(choiceId);
    if (!choice) {
      throw new Error('Choice is not found.');
    }
    return choice;
  }

  async setInputValue(inputId: string, value: any) {
    const input = this.findInput(inputId);
    const question = this.optionQuestionMap.get(inputId)!;

    try {
      this.optionValueMap.set(inputId, value);
      await this.validateInput(input, value);
      this.optionErrorMap.delete(inputId);
    } catch (err) {
      this.optionErrorMap.set(inputId, err.message);
    }

    try {
      this.validateQuestion(question);
      const answer = this.getQuestionAnswer(question);
      this.questionAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }
  }

  setInputQuestionAnswer(questionId: string, answer: any) {
    const input = this.questionInputMap.get(questionId)!;
    this.setInputValue(input.id, answer);
  }

  setChoiceValue(choiceId: string, selected: boolean) {
    this.findChoice(choiceId);
    const question = this.optionQuestionMap.get(choiceId)!;

    if (question.type === 'singleChoice') {
      const choices = this.questionChoicesMap.get(question.id)!;
      choices.forEach(choice => {
        this.optionValueMap.delete(choice.id);
      });
    }

    this.optionValueMap.set(choiceId, selected);

    try {
      this.validateQuestion(question);
      const answer = this.getQuestionAnswer(question);
      this.questionAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }
  }

  setSingleChoiceQuestionAnswer(questionId: string, answer: string) {
    const choices = this.questionChoicesMap.get(questionId)!;
    const selectedChoice = choices.find(choice => choice.value === answer);
    if (selectedChoice) {
      this.setChoiceValue(selectedChoice.id, true);
    }
  }

  setMultiChoiceQuestionAnswer(questionId: string, answer: string[]) {
    const choices = this.questionChoicesMap.get(questionId)!;
    choices.forEach(choice => {
      this.setChoiceValue(choice.id, answer.includes(choice.value));
    });
  }

  private getQuestionAnswer(question: Question) {
    if (question.disabled) {
      return undefined;
    }

    if (question.type === 'input') {
      const option = this.questionInputMap.get(question.id)!;
      return this.optionValueMap.get(option.id);
    }

    if (question.type === 'singleChoice') {
      const options = this.questionChoicesMap.get(question.id)!;
      return options.find(option => this.optionValueMap.get(option.id))?.value;
    }

    if (question.type === 'multiChoice') {
      const options = this.questionChoicesMap.get(question.id)!;
      return options.filter(option => this.optionValueMap.get(option.id)).map(option => option.value);
    }
  }

  private async validateInput(input: Input, value: any) {
    if (value == null) {
      if (!input.optional) {
        throw new Error('Answer cannot be null/undefined.');
      }
      return;
    }

    let validator: Validator | undefined;
    if (input.type) {
      validator = this.validators?.[input.type];
    }
    if (validator) {
      await validator(value, input.validation);
    }
  }

  private validateQuestion(question: Question) {
    const { type, optional, validation } = question;

    if (type === 'input') {
      const option = this.questionInputMap.get(question.id)!;
      const error = this.optionErrorMap.get(option.id);
      if (error) {
        throw new Error(error);
      }
      return;
    }

    if (type === 'singleChoice') {
      const answer = this.getQuestionAnswer(question);
      if (!answer && !optional) {
        throw new Error('You must select no less than 1 option.');
      }
      return;
    }

    if (type === 'multiChoice') {
      const answer = this.getQuestionAnswer(question);
      const { min, max } = validation || {};

      if (!answer.length) {
        if (!optional) {
          if (!!min) {
            throw new Error(`You must select no less than ${min} options.`);
          } else {
            throw new Error('You must select no less than 1 option.');
          }
        }
        return;
      }

      if (!!min && answer.length < min) {
        throw new Error(`You must select no less than ${min} options.`);
      }

      if (!!max && answer.length > max) {
        throw new Error(`You must select no more than ${max} options.`);
      }
    }
  }

}
