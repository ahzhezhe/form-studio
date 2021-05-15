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

export const fromGroupInitConfig = (
  parentGroupId: string | undefined, groups: GroupInitConfig[]): Group[] => groups.sort(managebleItemSorter).map((group, i) => {
  const id = group.id || (parentGroupId ? `${parentGroupId}_g${i}` : `g${i}`);
  return {
    id,
    order: group.order,
    disabled: !!group.disabled,
    uiConfig: group.uiConfig || {},
    groups: group.groups ? fromGroupInitConfig(id, group.groups) : [],
    questions: group.questions ? fromQuestionInitConfig(id, group.questions) : []
  };
});

export const fromQuestionInitConfig = (
  groupId: string, questions: QuestionInitConfig[]): Question[] => questions.sort(managebleItemSorter).map((question, i) => {
  const id = question.id || (groupId ? `${groupId}_q${i}` : `q${i}`);
  return {
    id,
    order: question.order,
    disabled: !!question.disabled,
    uiConfig: question.uiConfig || {},
    type: question.type,
    choices: question.type !== 'input' ? fromChoiceInitConfig(id, question.choices!) : undefined,
    validatorKey: question.validatorKey,
    validationConfig: question.validationConfig || {}
  };
});

export const fromChoiceInitConfig = (
  questionId: string, choices: ChoiceInitConfig[]): Choice[] => choices.sort(managebleItemSorter).map((choice, i) => {
  const id = choice.id || (questionId ? `${questionId}_c${i}` : `c${i}`);
  return {
    id,
    order: choice.order,
    disabled: !!choice.disabled,
    uiConfig: choice.uiConfig || {},
    value: choice.value || id,
    onSelected: choice.onSelected || {}
  };
});

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
  onSelected: choice.onSelected
}));
