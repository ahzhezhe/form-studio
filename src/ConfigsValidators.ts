import { Group } from './ExportedConfigs';
import { ConfigsValidationResult } from './Types';

export const validateConfigs = (groups: Group[], strict: boolean): ConfigsValidationResult => {
  const errorsById = new Map<string, string[]>();

  if (groups.length === 0) {
    addError(errorsById, '', 'There are no groups');

  } else {
    const allIds: string[] = [];
    const choiceValuesByQuestionId = new Map<string, any[]>();
    const onSelectedIdsByChoiceId = new Map<string, string[]>();
    collectData(errorsById, allIds, choiceValuesByQuestionId, onSelectedIdsByChoiceId, groups);

    const duplicatedIds = findDuplicates(allIds);
    duplicatedIds.forEach(id => addError(errorsById, id, 'Id is not unique'));

    for (const [questionId, values] of choiceValuesByQuestionId.entries()) {
      const duplicatedValues = findDuplicates(values);
      if (duplicatedValues.length) {
        addError(errorsById, questionId, 'There are choices with same values');
      }
    }

    if (strict) {
      for (const [choiceId, onSelectedIds] of onSelectedIdsByChoiceId.entries()) {
        for (const onSelectedId of onSelectedIds) {
          if (!allIds.includes(onSelectedId)) {
            addError(errorsById, choiceId, 'There are unrecognized id(s) in onSelected configs');
            break;
          }
        }
      }
    }
  }

  if (errorsById.size) {
    const errors: Record<string, string[]> = {};
    errorsById.forEach((values, key) => {
      errors[key] = values;
    });
    return { pass: false, errors };
  }
  return { pass: true };
};

const collectData = (errorsById: Map<string, string[]>, allIds: string[], choiceValuesByQuestionId: Map<string, any[]>,
  onSelectedIdsByChoiceId: Map<string, string[]>, groups: Group[]) => {
  for (const group of groups) {
    allIds.push(group.id);
    collectData(errorsById, allIds, choiceValuesByQuestionId, onSelectedIdsByChoiceId, group.groups);

    if (group.questions.length === 0) {
      addError(errorsById, group.id, 'There are no questions');
      continue;
    }

    for (const question of group.questions) {
      allIds.push(question.id);

      if (question.type !== 'any') {
        if (question.choices.length === 0) {
          addError(errorsById, group.id, 'There are no choices');
          continue;
        }

        for (const choice of question.choices) {
          allIds.push(choice.id);
          const onSelectedIds = [...(choice.onSelected.enable || []), ...(choice.onSelected.disable || [])];
          if (onSelectedIds.length) {
            onSelectedIdsByChoiceId.set(choice.id, onSelectedIds);
          }
        }
        choiceValuesByQuestionId.set(question.id, question.choices.map(choice => choice.value));
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

const addError = (errorsById: Map<string, string[]>, id: string, error: string) => {
  let errors = errorsById.get(id);
  if (!errors) {
    errors = [];
  }
  errors.push(error);
  errorsById.set(id, errors);
};
