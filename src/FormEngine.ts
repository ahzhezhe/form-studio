import shortUUID from 'short-uuid';
import { Config } from './Configs';
import { fromGroupInitConfig, toGroupConfig } from './Converters';
import { eventEmitter } from './EventEmitter';
import { InitConfig } from './InitConfigs';
import { Choice, Group, Question } from './Objects';
import { ChoiceTemplate, GroupTemplate, QuestionTemplate, Template } from './Templates';
import { Answers, ChoiceValue, Validator } from './Types';

export class FormEngine {

  private templateId: string;
  private validators: Record<string, Validator>;
  private groups: Group[];
  private groupMap = new Map<string, Group>();
  private questionMap = new Map<string, Question>();
  private choiceMap = new Map<string, Choice>();
  private groupParentGroupMap = new Map<string, Group>();
  private questionGroupMap = new Map<string, Group>();
  private choiceQuestionMap = new Map<string, Question>();
  private choiceSelectedMap = new Map<string, boolean>();
  private questionInputValueMap = new Map<string, any>();
  private questionAnswerMap = new Map<string, any>();
  private questionErrorMap = new Map<string, string>();

  private constructor(groups: Group[], validators: Record<string, Validator>) {
    this.templateId = shortUUID.generate();
    this.groups = groups;
    this.validators = validators;
    this.constructGroupMap(undefined, this.groups);
  }

  private constructGroupMap(parentGroup: Group | undefined, groups: Group[]) {
    groups.forEach(group => {
      this.groupMap.set(group.id!, group);
      this.constructGroupMap(group, group.groups || []);
      this.constructQuestionMap(group, group.questions || []);
      if (parentGroup) {
        this.groupParentGroupMap.set(group.id!, parentGroup);
      }
    });
  }

  private constructQuestionMap(group: Group, questions: Question[]) {
    questions.forEach(question => {
      this.questionMap.set(question.id!, question);
      this.questionGroupMap.set(question.id!, group);
      if (question.type !== 'input') {
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

  static fromConfig(config: InitConfig, validators?: Record<string, Validator>) {
    const groups = fromGroupInitConfig(config);
    return new FormEngine(groups, validators || {});
  }

  toTemplate(): Template {
    return this.toGroupTemplate(this.groups);
  }

  private toGroupTemplate(groups: Group[]): GroupTemplate[] {
    return groups.map((group): GroupTemplate => ({
      id: group.id,
      disabled: this.isGroupDisabled(group),
      uiConfig: group.uiConfig,
      groups: this.toGroupTemplate(group.groups),
      questions: this.toQuestionTemplate(group.questions)
    }));
  }

  private toQuestionTemplate(questions: Question[]): QuestionTemplate[] {
    return questions.map((question): QuestionTemplate => ({
      id: question.id,
      disabled: this.isQuestionDisabled(question),
      uiConfig: question.uiConfig,
      type: question.type,
      inputValue: question.type === 'input' ? this.questionInputValueMap.get(question.id) : undefined,
      choices: question.type !== 'input' ? this.toChoiceTemplate(question.choices!) : undefined,
      answer: this.isQuestionDisabled(question) ? undefined : this.questionAnswerMap.get(question.id),
      error: this.questionErrorMap.get(question.id)
    }));
  }

  private toChoiceTemplate(choices: Choice[]): ChoiceTemplate[] {
    return choices.map((choice): ChoiceTemplate => ({
      id: choice.id,
      disabled: this.isChoiceDisabled(choice),
      uiConfig: choice.uiConfig,
      value: choice.value,
      selected: !!this.choiceSelectedMap.get(choice.id)
    }));
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

    if (this.isQuestionDisabled(question)) {
      return;
    }

    try {
      this.questionInputValueMap.set(questionId, value);
      this.validateQuestion(question, value);
      this.questionAnswerMap.set(questionId, value);
      this.questionErrorMap.delete(questionId);
    } catch (err) {
      this.questionAnswerMap.delete(questionId);
      this.questionErrorMap.set(questionId, err.message);
    }

    this.refreshTemplate();
  }

  async setInputValuePromise(questionId: string, value: any) {
    const question = this.findQuestion(questionId);

    if (this.isQuestionDisabled(question)) {
      return;
    }

    try {
      this.questionInputValueMap.set(questionId, value);
      await this.validateQuestionPromise(question, value);
      this.questionAnswerMap.set(questionId, value);
      this.questionErrorMap.delete(questionId);
    } catch (err) {
      this.questionAnswerMap.delete(questionId);
      this.questionErrorMap.set(questionId, err.message);
    }

    this.refreshTemplate();
  }

  selectChoice(choiceId: string, selected: boolean) {
    const question = this.choiceQuestionMap.get(choiceId)!;
    this.internalSelectChoice(question, choiceId, selected, true);
  }

  async selectChoicePromise(choiceId: string, selected: boolean) {
    const question = this.choiceQuestionMap.get(choiceId)!;
    await this.internalSelectChoicePromise(question, choiceId, selected, true);
  }

  private internalSelectChoice(question: Question, choiceId: string, selected: boolean, validateAndRefresh: boolean) {
    const choice = this.findChoice(choiceId);

    if (this.isChoiceDisabled(choice)) {
      return;
    }

    if (question.type === 'singleChoice' && selected) {
      question.choices!.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    if (!validateAndRefresh) {
      return;
    }

    try {
      const answer = this.getQuestionAnswer(question);
      this.validateQuestion(question, answer);
      this.questionAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }

    this.refreshTemplate();
  }

  private async internalSelectChoicePromise(question: Question, choiceId: string, selected: boolean, validateAndRefresh: boolean) {
    const choice = this.findChoice(choiceId);

    if (this.isChoiceDisabled(choice)) {
      return;
    }

    if (question.type === 'singleChoice' && selected) {
      question.choices!.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    if (!validateAndRefresh) {
      return;
    }

    try {
      const answer = this.getQuestionAnswer(question);
      await this.validateQuestionPromise(question, answer);
      this.questionAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }

    this.refreshTemplate();
  }

  setChoice(questionId: string, value: ChoiceValue) {
    const question = this.findQuestion(questionId);

    if (this.isQuestionDisabled(question)) {
      return;
    }

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      this.internalSelectChoice(question, choice.id, choice.value === value, i === question.choices!.length - 1);
    }
  }

  async setChoicePromise(questionId: string, value: ChoiceValue) {
    const question = this.findQuestion(questionId);

    if (this.isQuestionDisabled(question)) {
      return;
    }

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      await this.internalSelectChoicePromise(question, choice.id, choice.value === value, i === question.choices!.length - 1);
    }
  }

  setChoices(questionId: string, values: ChoiceValue[]) {
    const question = this.findQuestion(questionId);

    if (this.isQuestionDisabled(question)) {
      return;
    }

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      this.internalSelectChoice(question, choice.id, values.includes(choice.value), i === question.choices!.length - 1);
    }
  }

  async setChoicesPromise(questionId: string, values: ChoiceValue[]) {
    const question = this.findQuestion(questionId);

    if (this.isQuestionDisabled(question)) {
      return;
    }

    for (let i = 0; i < question.choices!.length; i++) {
      const choice = question.choices![i];
      await this.internalSelectChoicePromise(question, choice.id, values.includes(choice.value), i === question.choices!.length - 1);
    }
  }

  private getQuestionAnswer(question: Question) {
    if (question.type === 'input') {
      return this.questionInputValueMap.get(question.id)!;
    }

    if (question.type === 'singleChoice') {
      return question.choices!.find(choice => this.choiceSelectedMap.get(choice.id))?.value;
    }

    if (question.type === 'multiChoice') {
      return question.choices!.filter(choice => this.choiceSelectedMap.get(choice.id)).map(choice => choice.value);
    }
  }

  private validateQuestion(question: Question, value: any) {
    if (!question.validatorKey) {
      return;
    }
    const validator = this.validators[question.validatorKey];
    if (!validator) {
      return;
    }
    validator(value, question.validationConfig || {});
  }

  private async validateQuestionPromise(question: Question, value: any) {
    if (!question.validatorKey) {
      return;
    }
    const validator = this.validators[question.validatorKey];
    if (!validator) {
      return;
    }
    await validator(value, question.validationConfig || {});
  }

  private isGroupDisabled(group: Group): boolean {
    if (group.disabled) {
      return true;
    }
    const parentGroup = this.groupParentGroupMap.get(group.id);
    if (parentGroup) {
      return this.isGroupDisabled(parentGroup);
    }
    return false;
  }

  private isQuestionDisabled(question: Question) {
    if (question.disabled) {
      return true;
    }
    const group = this.questionGroupMap.get(question.id)!;
    return this.isGroupDisabled(group);
  }

  private isChoiceDisabled(choice: Choice) {
    if (choice.disabled) {
      return true;
    }
    const question = this.choiceQuestionMap.get(choice.id)!;
    return this.isQuestionDisabled(question);
  }

  importAnswers(answers: Answers) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      const answer = answers[questionId];
      if (question.type === 'input') {
        this.setInputValue(questionId, answer);
      } else if (question.type === 'singleChoice') {
        this.setChoice(questionId, answer);
      } else if (question.type === 'multiChoice') {
        this.setChoices(questionId, answer);
      }
    }
  }

  async importAnswersPromise(answers: Answers) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      const answer = answers[questionId];
      if (question.type === 'input') {
        await this.setInputValuePromise(questionId, answer);
      } else if (question.type === 'singleChoice') {
        await this.setChoicePromise(questionId, answer);
      } else if (question.type === 'multiChoice') {
        await this.setChoicesPromise(questionId, answer);
      }
    }
  }

  exportConfig(): Config {
    return toGroupConfig(this.groups);
  }

  exportAnswers(): Answers {
    const answes: Answers = {};

    for (const entry of this.questionMap.entries()) {
      const [questionId] = entry;
      const answer = this.questionAnswerMap.get(questionId);
      answes[questionId] = answer;
    }

    return answes;
  }

  private getTemplateId() {
    return this.templateId;
  }

  private refreshTemplate() {
    eventEmitter.emit(this.templateId);
  }

}
