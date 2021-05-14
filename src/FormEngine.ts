import shortUUID from 'short-uuid';
import { Config, GroupConfig, QuestionConfig, managebleItemSorter, ChoiceConfig } from './Configs';
import { Choice, Group, Question } from './Objects';
import { ChoiceTemplate, GroupTemplate, QuestionTemplate, Template } from './Templates';
import { ConfigType } from './Types';

export type Validator = (value: any, validation: ConfigType) => void | Promise<void>;

export class FormEngine {

  private validators?: Record<string, Validator>;
  private groups: Group[];
  private groupMap = new Map<string, Group>();
  private questionMap = new Map<string, Question>();
  private choiceMap = new Map<string, Choice>();
  private questionChoicesMap = new Map<string, Choice[]>();
  private choiceQuestionMap = new Map<string, Question>();
  private choiceSelectedMap = new Map<string, boolean>();
  private questionInputValueMap = new Map<string, any>();
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
      if (question.type !== 'input') {
        this.questionChoicesMap.set(question.id!, question.choices!);
        this.constructChoiceMap(question, question.choices!);
      }
    });
  }

  private constructChoiceMap(question: Question, choices: Choice[]) {
    choices.forEach(choice => {
      this.choiceMap.set(choice.id!, choice);
      this.choiceQuestionMap.set(choice.id!, question);
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
      uiConfig: group.uiConfig,
      groups: group.groups ? this.fromGroupConfig(group.groups) : [],
      questions: group.questions ? this.fromQuestionConfig(group.questions) : []
    }));
  }

  private static fromQuestionConfig(questions: QuestionConfig[]): Question[] {
    return questions.sort(managebleItemSorter).map((question): Question => ({
      id: question.id || shortUUID.generate(),
      disabled: !!question.disabled,
      uiConfig: question.uiConfig,
      type: question.type,
      inputType: question.type === 'input' ? question.inputType : undefined,
      choices: question.type !== 'input' ? this.fromChoiceConfig(question.choices!) : undefined,
      validation: question.validation
    }));
  }

  private static fromChoiceConfig(choices: ChoiceConfig[]): Choice[] {
    return choices.sort(managebleItemSorter).map((choice): Choice => ({
      id: choice.id || shortUUID.generate(),
      disabled: !!choice.disabled,
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
      uiConfig: group.uiConfig,
      groups: this.toGroupTemplate(group.groups),
      questions: this.toQuestionTemplate(group.questions)
    }));
  }

  private toQuestionTemplate(questions: Question[]): QuestionTemplate[] {
    return questions.map((question): QuestionTemplate => ({
      id: question.id,
      disabled: question.disabled,
      uiConfig: question.uiConfig,
      type: question.type,
      inputType: question.type === 'input' ? question.inputType : undefined,
      inputValue: question.type === 'input' ? this.questionInputValueMap.get(question.id) : undefined,
      choices: question.type !== 'input' ? this.toChoiceTemplate(question.choices!) : undefined,
      answer: this.questionAnswerMap.get(question.id),
      error: this.questionErrorMap.get(question.id)
    }));
  }

  private toChoiceTemplate(choices: Choice[]): ChoiceTemplate[] {
    return choices.map((choice): ChoiceTemplate => ({
      id: choice.id,
      disabled: choice.disabled,
      uiConfig: choice.uiConfig,
      value: choice.value,
      selected: !!this.choiceSelectedMap.get(choice.id)
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

  private findChoice(choiceId: string) {
    const choice = this.choiceMap.get(choiceId);
    if (!choice) {
      throw new Error('Choice is not found.');
    }
    return choice;
  }

  setInputValue(questionId: string, value: any) {
    const question = this.findQuestion(questionId);

    try {
      this.questionInputValueMap.set(questionId, value);
      this.validateInput(question, value);
      this.questionAnswerMap.set(questionId, value);
      this.questionErrorMap.delete(questionId);
    } catch (err) {
      this.questionAnswerMap.delete(questionId);
      this.questionErrorMap.set(questionId, err.message);
    }
  }

  async setInputValuePromise(questionId: string, value: any) {
    const question = this.findQuestion(questionId);

    try {
      this.questionInputValueMap.set(questionId, value);
      await this.validateInputPromise(question, value);
      this.questionAnswerMap.set(questionId, value);
      this.questionErrorMap.delete(questionId);
    } catch (err) {
      this.questionAnswerMap.delete(questionId);
      this.questionErrorMap.set(questionId, err.message);
    }
  }

  selectChoice(choiceId: string, selected: boolean) {
    this.findChoice(choiceId);
    const question = this.choiceQuestionMap.get(choiceId)!;

    if (question.type === 'singleChoice') {
      const choices = this.questionChoicesMap.get(question.id)!;
      choices.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    try {
      this.validateChoiceQuestion(question);
      const answer = this.getQuestionAnswer(question);
      this.questionAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }
  }

  setChoice(questionId: string, value: string) {
    const choices = this.questionChoicesMap.get(questionId)!;
    const selectedChoice = choices.find(choice => choice.value === value);
    if (selectedChoice) {
      this.selectChoice(selectedChoice.id, true);
    }
  }

  setChoices(questionId: string, values: string[]) {
    const choices = this.questionChoicesMap.get(questionId)!;
    choices.forEach(choice => {
      this.selectChoice(choice.id, values.includes(choice.value));
    });
  }

  private getQuestionAnswer(question: Question) {
    if (question.type === 'input') {
      return this.questionInputValueMap.get(question.id)!;
    }

    if (question.type === 'singleChoice') {
      const choices = this.questionChoicesMap.get(question.id)!;
      return choices.find(choice => this.choiceSelectedMap.get(choice.id))?.value;
    }

    if (question.type === 'multiChoice') {
      const choices = this.questionChoicesMap.get(question.id)!;
      return choices.filter(choice => this.choiceSelectedMap.get(choice.id)).map(choice => choice.value);
    }
  }

  private validateInput(question: Question, value: any) {
    const validator = this.validators?.[question.inputType!];
    if (validator) {
      validator(value, question.validation || {});
    }
  }

  private async validateInputPromise(question: Question, value: any) {
    const validator = this.validators?.[question.inputType!];
    if (validator) {
      await validator(value, question.validation || {});
    }
  }

  private validateChoiceQuestion(question: Question) {
    const { type, validation } = question;

    if (type === 'singleChoice') {
      const answer = this.getQuestionAnswer(question);
      if (!answer) {
        throw new Error('You must select an option.');
      }
      return;
    }

    if (type === 'multiChoice') {
      const answer = this.getQuestionAnswer(question);

      const { min, max } = validation || {};
      if (!!min && answer.length < min) {
        throw new Error(`You must select no less than ${min} options.`);
      }
      if (!!max && answer.length > max) {
        throw new Error(`You must select no more than ${max} options.`);
      }
    }
  }

}
