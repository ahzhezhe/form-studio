import { ChoiceConfigs, Configs, GroupConfigs, QuestionConfigs } from './Configs';
import { Choice, ExportedConfigs, Group, Question } from './ExportedConfigs';

export const sanitizeConfigs = (configs: Configs): ExportedConfigs => ({
  groups: configs.groups ? sanitizeGroupConfigs(undefined, configs.groups) : [],
  questions: configs.questions ? sanitizeQuestionConfigs(undefined, configs.questions) : []
});

const sanitizeGroupConfigs = (parentGroupId: string | undefined, groups: GroupConfigs[]): Group[] => groups.map((group, i) => {
  const id = group.id || (parentGroupId ? `${parentGroupId}_g${i}` : `g${i}`);
  return {
    id,
    defaultDisabled: !!group.defaultDisabled,
    custom: group.custom,
    groups: group.groups ? sanitizeGroupConfigs(id, group.groups) : [],
    questions: group.questions ? sanitizeQuestionConfigs(id, group.questions) : []
  };
});

const sanitizeQuestionConfigs = (groupId: string | undefined, questions: QuestionConfigs[]): Question[] => questions.map((question, i) => {
  const id = question.id || (groupId ? `${groupId}_q${i}` : `q${i}`);
  return {
    id,
    defaultDisabled: !!question.defaultDisabled,
    custom: question.custom,
    type: question.type,
    choices: question.type !== 'any' ? sanitizeChoiceConfigs(id, question.choices || []) : [],
    validators: question.validators || [],
    defaultAnswer: question.defaultAnswer
  };
});

const sanitizeChoiceConfigs = (questionId: string, choices: ChoiceConfigs[]): Choice[] => choices.map((choice, i) => {
  const id = choice.id || `${questionId}_c${i}`;
  return {
    id,
    defaultDisabled: !!choice.defaultDisabled,
    custom: choice.custom,
    value: choice.value === undefined || choice.value === null ? id : choice.value,
    onSelected: choice.onSelected || {}
  };
});
