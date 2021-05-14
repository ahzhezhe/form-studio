import shortUUID from 'short-uuid';
import { ChoiceConfig, GroupConfig, QuestionConfig } from './Configs';
import { ChoiceInitConfig, GroupInitConfig, ManagebleItemInitConfig, QuestionInitConfig } from './InitConfigs';
import { Choice, Group, Question } from './Objects';

const managebleItemSorter = (a: ManagebleItemInitConfig, b: ManagebleItemInitConfig) => {
  if (!!!a.order && !!!b.order) {
    return 0;
  }
  if (!!!b.order) {
    return -1;
  }
  if (!!!a.order) {
    return 1;
  }
  return a.order - b.order;
};

export const fromGroupInitConfig = (groups: GroupInitConfig[]): Group[] => groups.sort(managebleItemSorter).map(group => ({
  id: group.id || shortUUID.generate(),
  order: group.order,
  disabled: !!group.disabled,
  uiConfig: group.uiConfig || {},
  groups: group.groups ? fromGroupInitConfig(group.groups) : [],
  questions: group.questions ? fromQuestionInitConfig(group.questions) : []
}));

export const fromQuestionInitConfig = (questions: QuestionInitConfig[]): Question[] => questions.sort(managebleItemSorter).map(question => ({
  id: question.id || shortUUID.generate(),
  order: question.order,
  disabled: !!question.disabled,
  uiConfig: question.uiConfig || {},
  type: question.type,
  choices: question.type !== 'input' ? fromChoiceInitConfig(question.choices!) : undefined,
  validatorKey: question.validatorKey,
  validationConfig: question.validationConfig || {}
}));

export const fromChoiceInitConfig = (choices: ChoiceInitConfig[]): Choice[] => choices.sort(managebleItemSorter).map(choice => ({
  id: choice.id || shortUUID.generate(),
  order: choice.order,
  disabled: !!choice.disabled,
  uiConfig: choice.uiConfig || {},
  value: choice.value,
  onChange: choice.onChange || {}
}));

export const toGroupConfig = (groups: Group[]): GroupConfig[] => groups.map(group => ({
  id: group.id,
  order: group.order,
  disabled: group.disabled,
  uiConfig: group.uiConfig || {},
  groups: toGroupConfig(group.groups),
  questions: toQuestionConfig(group.questions)
}));

export const toQuestionConfig = (questions: Question[]): QuestionConfig[] => questions.map(question => ({
  id: question.id,
  order: question.order,
  disabled: question.disabled,
  uiConfig: question.uiConfig || {},
  type: question.type,
  choices: question.type !== 'input' ? toChoiceConfig(question.choices!) : undefined,
  validatorKey: question.validatorKey,
  validationConfig: question.validationConfig
}));

export const toChoiceConfig = (choices: Choice[]): ChoiceConfig[] => choices.map(choice => ({
  id: choice.id,
  order: choice.order,
  disabled: choice.disabled,
  uiConfig: choice.uiConfig,
  value: choice.value,
  onChange: choice.onChange
}));
