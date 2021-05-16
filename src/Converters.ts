import { ChoiceConfig, GroupConfig, QuestionConfig } from './Configs';
import { Choice, Group, Question } from './FormObjects';
import { ChoiceInitConfig, GroupInitConfig, ManagebleItemInitConfig, QuestionInitConfig } from './InitConfigs';

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

export const fromGroupInitConfigs = (
  parentGroupId: string | undefined, groups: GroupInitConfig[]): Group[] => groups.sort(managebleItemSorter).map((group, i) => {
  const id = group.id || (parentGroupId ? `${parentGroupId}_g${i}` : `g${i}`);
  return {
    id,
    order: group.order,
    defaultDisabled: !!group.defaultDisabled,
    ui: group.ui || {},
    groups: group.groups ? fromGroupInitConfigs(id, group.groups) : [],
    questions: group.questions ? fromQuestionInitConfigs(id, group.questions) : []
  };
});

export const fromQuestionInitConfigs = (
  groupId: string, questions: QuestionInitConfig[]): Question[] => questions.sort(managebleItemSorter).map((question, i) => {
  const id = question.id || (groupId ? `${groupId}_q${i}` : `q${i}`);
  return {
    id,
    order: question.order,
    defaultDisabled: !!question.defaultDisabled,
    ui: question.ui || {},
    type: question.type,
    choices: question.type !== 'any' ? fromChoiceInitConfigs(id, question.choices!) : [],
    validator: question.validator,
    validation: question.validation || {},
    defaultAnswer: question.defaultAnswer
  };
});

export const fromChoiceInitConfigs = (
  questionId: string, choices: ChoiceInitConfig[]): Choice[] => choices.sort(managebleItemSorter).map((choice, i) => {
  const id = choice.id || (questionId ? `${questionId}_c${i}` : `c${i}`);
  return {
    id,
    order: choice.order,
    defaultDisabled: !!choice.defaultDisabled,
    ui: choice.ui || {},
    value: choice.value || id,
    onSelected: choice.onSelected || {}
  };
});

export const toGroupConfigs = (groups: Group[]): GroupConfig[] => groups.map(group => ({
  id: group.id,
  order: group.order,
  defaultDisabled: group.defaultDisabled,
  ui: group.ui || {},
  groups: toGroupConfigs(group.groups),
  questions: toQuestionConfigs(group.questions)
}));

export const toQuestionConfigs = (questions: Question[]): QuestionConfig[] => questions.map(question => ({
  id: question.id,
  order: question.order,
  defaultDisabled: question.defaultDisabled,
  ui: question.ui || {},
  type: question.type,
  choices: question.type !== 'any' ? toChoiceConfigs(question.choices!) : [],
  validator: question.validator,
  validation: question.validation,
  defaultAnswer: question.defaultAnswer
}));

export const toChoiceConfigs = (choices: Choice[]): ChoiceConfig[] => choices.map(choice => ({
  id: choice.id,
  order: choice.order,
  defaultDisabled: choice.defaultDisabled,
  ui: choice.ui,
  value: choice.value,
  onSelected: choice.onSelected
}));
