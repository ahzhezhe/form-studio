import { Group } from './ExportedConfigs';
import { ConfigsValidationResult } from './Types';

export const validateConfigs = (groups: Group[], strict: boolean): ConfigsValidationResult => {
  const errorMap = new Map<string, string[]>();

  if (groups.length === 0) {
    addError(errorMap, '', 'There are no groups');

  } else {
    const allIds: string[] = [];
    const questionChoiceValues = new Map<string, any[]>();
    const choiceOnSelectedIds = new Map<string, string[]>();
    collectData(errorMap, allIds, questionChoiceValues, choiceOnSelectedIds, groups);

    const duplicatedIds = findDuplicates(allIds);
    duplicatedIds.forEach(id => addError(errorMap, id, 'Id is not unique'));

    for (const [questionId, values] of questionChoiceValues.entries()) {
      const duplicatedValues = findDuplicates(values);
      if (duplicatedValues.length) {
        addError(errorMap, questionId, 'There are choices with same values');
      }
    }

    if (strict) {
      for (const [choiceId, onSelectedIds] of choiceOnSelectedIds.entries()) {
        for (const onSelectedId of onSelectedIds) {
          if (!allIds.includes(onSelectedId)) {
            addError(errorMap, choiceId, 'There are unrecognized id(s) in onSelected configs');
            break;
          }
        }
      }
    }
  }

  if (errorMap.size) {
    const errors: Record<string, string[]> = {};
    errorMap.forEach((values, key) => {
      errors[key] = values;
    });
    return { pass: false, errors };
  }
  return { pass: true };
};

const collectData = (errorMap: Map<string, string[]>, allIds: string[], questionChoiceValues: Map<string, any[]>,
  choiceOnSelectedIds: Map<string, string[]>, groups: Group[]) => {
  for (const group of groups) {
    allIds.push(group.id);
    collectData(errorMap, allIds, questionChoiceValues, choiceOnSelectedIds, group.groups);

    if (group.questions.length === 0) {
      addError(errorMap, group.id, 'There are no questions');
      continue;
    }

    for (const question of group.questions) {
      allIds.push(question.id);

      if (question.type !== 'any') {
        if (question.choices.length === 0) {
          addError(errorMap, group.id, 'There are no choices');
          continue;
        }

        for (const choice of question.choices) {
          allIds.push(choice.id);
          const onSelectedIds = [...(choice.onSelected.enable || []), ...(choice.onSelected.disable || [])];
          if (onSelectedIds.length) {
            choiceOnSelectedIds.set(choice.id, onSelectedIds);
          }
        }
        questionChoiceValues.set(question.id, question.choices.map(choice => choice.value));
      }
    }
  }
};

const findDuplicates = <T>(arr: T[]) => {
  const sorted = arr.slice().sort();
  const duplicatedIds = new Set<T>();
  for (let i = 0; i < sorted.length - 1; i++) {
    if (sorted[i + 1] === sorted[i]) {
      duplicatedIds.add(sorted[i]);
    }
  }
  return Array.from(duplicatedIds);
};

const addError = (errorMap: Map<string, string[]>, id: string, error: string) => {
  let errors = errorMap.get(id);
  if (!errors) {
    errors = [];
  }
  errors.push(error);
  errorMap.set(id, errors);
};
