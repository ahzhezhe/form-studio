import shortUUID from 'short-uuid';
import { Config } from './Configs';
import { fromGroupInitConfig, toGroupConfig } from './Converters';
import { eventEmitter } from './EventEmitter';
import { InitConfig } from './InitConfigs';
import { Choice, Group, Question } from './Objects';
import { ChoiceTemplate, GroupTemplate, QuestionTemplate, Template } from './Templates';
import { Answers, ChoiceValue, Errors, Validator } from './Types';

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
    const groups = fromGroupInitConfig(undefined, config);
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

    this.refreshTemplate();
  }

  async selectChoicePromise(choiceId: string, selected: boolean) {
    const question = this.choiceQuestionMap.get(choiceId)!;
    await this.internalSelectChoicePromise(question, choiceId, selected, true);

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

    this.refreshTemplate();
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

    this.refreshTemplate();
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

    this.refreshTemplate();
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

    this.refreshTemplate();
  }

  private internalSelectChoice(question: Question, choiceId: string, selected: boolean, validate: boolean) {
    const choice = this.findChoice(choiceId);

    if (question.type === 'single' && selected) {
      question.choices!.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    this.setDisabled(choice, selected);

    if (!validate) {
      return;
    }

    try {
      const answer = this.getQuestionValue(question);
      this.validateQuestion(question, answer);
      this.questionAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }
  }

  private async internalSelectChoicePromise(question: Question, choiceId: string, selected: boolean, validate: boolean) {
    const choice = this.findChoice(choiceId);

    if (this.isChoiceDisabled(choice)) {
      return;
    }

    if (question.type === 'single' && selected) {
      question.choices!.forEach(choice => this.choiceSelectedMap.set(choice.id, false));
    }

    this.choiceSelectedMap.set(choiceId, selected);

    this.setDisabled(choice, selected);

    if (!validate) {
      return;
    }

    try {
      const answer = this.getQuestionValue(question);
      await this.validateQuestionPromise(question, answer);
      this.questionAnswerMap.set(question.id, answer);
      this.questionErrorMap.delete(question.id);
    } catch (err) {
      this.questionAnswerMap.delete(question.id);
      this.questionErrorMap.set(question.id, err.message);
    }
  }

  private setDisabled(choice: Choice, selected: boolean) {
    let disablings = choice.onChange.disable || [];
    let enablings = choice.onChange.enable || [];
    if (!selected) {
      enablings = choice.onChange.disable || [];
      disablings = choice.onChange.enable || [];
    }

    disablings.forEach(id => {
      const group = this.groupMap.get(id);
      const question = this.questionMap.get(id);
      const choice = this.choiceMap.get(id);
      if (group) {
        group.disabled = true;
      }
      if (question) {
        question.disabled = true;
      }
      if (choice) {
        choice.disabled = true;
      }
    });

    enablings.forEach(id => {
      const group = this.groupMap.get(id);
      const question = this.questionMap.get(id);
      const choice = this.choiceMap.get(id);
      if (group) {
        group.disabled = false;
      }
      if (question) {
        question.disabled = false;
      }
      if (choice) {
        choice.disabled = false;
      }
    });
  }

  private getQuestionValue(question: Question) {
    if (question.type === 'input') {
      return this.questionInputValueMap.get(question.id)!;
    }

    if (question.type === 'single') {
      return question.choices!.find(choice => !choice.disabled && this.choiceSelectedMap.get(choice.id))?.value;
    }

    if (question.type === 'multiple') {
      return question.choices!.filter(choice => !choice.disabled && this.choiceSelectedMap.get(choice.id)).map(choice => choice.value);
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

  exportConfig(): Config {
    return toGroupConfig(this.groups);
  }

  importAnswers(answers: Answers, retainCurrentValue?: boolean) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      let answer = answers[questionId];

      if (answer === undefined && retainCurrentValue) {
        answer = this.getQuestionValue(question);
      }

      if (question.type === 'input') {
        this.setInputValue(questionId, answer);
      } else if (question.type === 'single') {
        this.setChoice(questionId, answer);
      } else if (question.type === 'multiple') {
        this.setChoices(questionId, answer || []);
      }
    }
  }

  async importAnswersPromise(answers: Answers, retainCurrentValue?: boolean) {
    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      let answer = answers[questionId];

      if (answer === undefined && retainCurrentValue) {
        answer = this.getQuestionValue(question);
      }

      if (question.type === 'input') {
        await this.setInputValuePromise(questionId, answer);
      } else if (question.type === 'single') {
        await this.setChoicePromise(questionId, answer);
      } else if (question.type === 'multiple') {
        await this.setChoicesPromise(questionId, answer || []);
      }
    }
  }

  exportAnswers(): Answers {
    const answes: Answers = {};

    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      if (!this.isQuestionDisabled(question)) {
        const answer = this.questionAnswerMap.get(questionId);
        if (answer !== undefined) {
          answes[questionId] = answer;
        }
      }
    }

    return answes;
  }

  exportErrors(): Errors {
    const errors: Errors = {};

    for (const entry of this.questionMap.entries()) {
      const [questionId, question] = entry;
      if (!this.isQuestionDisabled(question)) {
        const error = this.questionErrorMap.get(questionId);
        if (error !== undefined) {
          errors[questionId] = error;
        }
      }
    }

    return errors;
  }

  validate() {
    const answers = this.exportAnswers();
    this.importAnswers(answers, true);
    return this.isClean();
  }

  async validatePromise() {
    const answers = this.exportAnswers();
    await this.importAnswersPromise(answers, true);
    return this.isClean();
  }

  isClean() {
    for (const entry of this.questionErrorMap.entries()) {
      const [questionId, error] = entry;
      const question = this.findQuestion(questionId);
      if (this.isQuestionDisabled(question)) {
        continue;
      }
      if (error) {
        return false;
      }
    }
    return true;
  }

  private getTemplateId() {
    return this.templateId;
  }

  private refreshTemplate() {
    eventEmitter.emit(this.templateId);
  }

}
