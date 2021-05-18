import { ChoiceConfigs, GroupConfigs, ItemConfigs, QuestionConfigs } from './Configs';
import { ExportedChoiceConfigs, ExportedGroupConfigs, ExportedQuestionConfigs } from './ExportedConfigs';
import { Choice, Group, Question } from './FormObjects';

const itemSorter = (a: ItemConfigs, b: ItemConfigs) => {
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

export const fromGroupConfigs = (
  parentGroupId: string | undefined, groups: GroupConfigs[]): Group[] => groups.sort(itemSorter).map((group, i) => {
  const id = group.id || (parentGroupId ? `${parentGroupId}_g${i}` : `g${i}`);
  return {
    id,
    order: group.order,
    defaultDisabled: !!group.defaultDisabled,
    ui: group.ui || {},
    groups: group.groups ? fromGroupConfigs(id, group.groups) : [],
    questions: group.questions ? fromQuestionConfigs(id, group.questions) : []
  };
});

export const fromQuestionConfigs = (
  groupId: string, questions: QuestionConfigs[]): Question[] => questions.sort(itemSorter).map((question, i) => {
  const id = question.id || `${groupId}_q${i}`;
  return {
    id,
    order: question.order,
    defaultDisabled: !!question.defaultDisabled,
    ui: question.ui || {},
    type: question.type,
    choices: question.type !== 'any' ? fromChoiceConfigs(id, question.choices || []) : [],
    validators: question.validators || [],
    validation: question.validation || {},
    defaultAnswer: question.defaultAnswer
  };
});

export const fromChoiceConfigs = (
  questionId: string, choices: ChoiceConfigs[]): Choice[] => choices.sort(itemSorter).map((choice, i) => {
  const id = choice.id || `${questionId}_c${i}`;
  return {
    id,
    order: choice.order,
    defaultDisabled: !!choice.defaultDisabled,
    ui: choice.ui || {},
    value: choice.value === undefined || choice.value === null ? id : choice.value,
    onSelected: choice.onSelected || {}
  };
});

export const toGroupConfigs = (groups: Group[]): ExportedGroupConfigs[] => groups.map(group => ({
  id: group.id,
  order: group.order,
  defaultDisabled: group.defaultDisabled,
  ui: group.ui || {},
  groups: toGroupConfigs(group.groups),
  questions: toQuestionConfigs(group.questions)
}));

export const toQuestionConfigs = (questions: Question[]): ExportedQuestionConfigs[] => questions.map(question => ({
  id: question.id,
  order: question.order,
  defaultDisabled: question.defaultDisabled,
  ui: question.ui || {},
  type: question.type,
  choices: question.type !== 'any' ? toChoiceConfigs(question.choices) : [],
  validators: question.validators,
  validation: question.validation,
  defaultAnswer: question.defaultAnswer
}));

export const toChoiceConfigs = (choices: Choice[]): ExportedChoiceConfigs[] => choices.map(choice => ({
  id: choice.id,
  order: choice.order,
  defaultDisabled: choice.defaultDisabled,
  ui: choice.ui,
  value: choice.value,
  onSelected: choice.onSelected
}));
