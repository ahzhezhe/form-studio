import { Choice, ExportedConfigs, Group, Item, Question } from './ExportedConfigs';
import { ConfigsValidationResult } from './Types';

export class ConfigsValidator {

  readonly #errorsById = new Map<string, string[]>();
  readonly #warningsById = new Map<string, string[]>();
  readonly #allIds: string[] = [];
  readonly #abledWhenIdsById = new Map<string, string[]>();
  readonly #choiceValuesByQuestionId = new Map<string, any[]>();
  readonly #onSelectedIdsByChoiceId = new Map<string, string[]>();
  readonly #parentIdsById = new Map<string, string[]>();
  readonly #circularIds: string[] = [];

  validate(configs: ExportedConfigs, strict: boolean): ConfigsValidationResult {
    // Form is not without any groups or questions
    if (configs.groups.length === 0 && configs.questions.length === 0) {
      this.#addError('', 'There are no groups or questions');
      return this.#getResult();
    }

    // Collect data for subsequent validations
    this.#collectData(configs);

    // No duplicated ids within the form
    const duplicatedIds = this.#findDuplicates(this.#allIds);
    duplicatedIds.forEach(id => this.#addError(id, 'Id is not unique'));

    // No duplicated choice values within a question
    for (const [questionId, values] of this.#choiceValuesByQuestionId.entries()) {
      const duplicatedValues = this.#findDuplicates(values);
      if (duplicatedValues.length) {
        this.#addError(questionId, 'There are choices with same values');
      }
    }

    // No circular choices' `onSelected` configs
    if (!duplicatedIds.length) {
      for (const id of this.#allIds) {
        this.#checkCircular(id, id);
      }
    }

    if (strict) {
      // No unrecognized ids in choices' `onSelected` configs
      for (const [choiceId, onSelectedIds] of this.#onSelectedIdsByChoiceId.entries()) {
        for (const onSelectedId of onSelectedIds) {
          if (!this.#allIds.includes(onSelectedId)) {
            this.#addError(choiceId, 'There are unrecognized id(s) in onSelected configs');
            break;
          }
        }
      }
    }

    return this.#getResult();
  }

  #checkCircular(mainId: string, subId: string) {
    const parentIds = this.#parentIdsById.get(subId)!;

    if (parentIds.includes(mainId)) {
      this.#addError(mainId, `Circular relationship with '${subId}'`);
      this.#circularIds.push(mainId);
      return;
    }

    for (const parentId of parentIds) {
      if (this.#circularIds.includes(parentId)) {
        continue;
      }
      this.#checkCircular(mainId, parentId);
    }
  }

  #collectData(configs: ExportedConfigs) {
    this.#collectGroupData(undefined, configs.groups);

    for (const [choiceId, onSelectedIds] of this.#onSelectedIdsByChoiceId) {
      for (const onSelectedId of onSelectedIds) {
        const parentIds = this.#parentIdsById.get(onSelectedId);
        if (parentIds) {
          parentIds.push(choiceId);
          this.#parentIdsById.set(onSelectedId, parentIds);
        }
      }
    }
  }

  #collectItemData(parentId: string | undefined, item: Item) {
    this.#allIds.push(item.id);

    const abledWhenIds = this.#abledWhenIdsById.get(item.id) ?? [];
    abledWhenIds.push(...(item.enabledOnSelected?.flatMap(id => id) ?? []));
    abledWhenIds.push(...(item.disabledOnSelected?.flatMap(id => id) ?? []));

    if (parentId) {
      this.#parentIdsById.set(item.id, [parentId]);
    } else {
      this.#parentIdsById.set(item.id, []);
    }
  }

  #collectGroupData(parentGroupId: string | undefined, groups: Group[]) {
    for (const group of groups) {
      this.#collectItemData(parentGroupId, group);
      this.#collectGroupData(group.id, group.groups);

      // No groups without questions
      if (group.questions.length === 0) {
        this.#addError(group.id, 'There are no questions');
        continue;
      }

      this.#collectQuestionData(group.id, group.questions);
    }
  }

  #collectQuestionData(groupId: string | undefined, questions: Question[]) {
    for (const question of questions) {
      this.#collectItemData(groupId, question);

      // No questions with `choice` or `choices` as type without choices
      if (question.type !== 'any') {
        if (question.choices.length === 0) {
          this.#addError(question.id, 'There are no choices');
          continue;
        }

        this.#collectChoiceData(question.id, question.choices);

        this.#choiceValuesByQuestionId.set(question.id, question.choices.map(choice => choice.value));
      }
    }
  }

  #collectChoiceData(questionId: string, choices: Choice[]) {
    for (const choice of choices) {
      this.#collectItemData(questionId, choice);

      const onSelectedIds = [...(choice.onSelected?.enable ?? []), ...(choice.onSelected?.disable ?? [])];
      if (onSelectedIds.length) {
        this.#onSelectedIdsByChoiceId.set(choice.id, onSelectedIds);
      }

      if (choice.onSelected) {
        this.#addWarning(choice.id, 'onSelected is deprecated');
      }
    }
  }

  #findDuplicates <T>(arr: T[]) {
    const sorted = arr.slice().sort();
    const duplicatedIds = new Set<T>();
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] === sorted[i]) {
        duplicatedIds.add(sorted[i]);
      }
    }
    return Array.from(duplicatedIds);
  }

  #addError(id: string, error: string) {
    let errors = this.#errorsById.get(id);
    if (!errors) {
      errors = [];
    }
    errors.push(error);
    this.#errorsById.set(id, errors);
  }

  #addWarning(id: string, warning: string) {
    let warnings = this.#warningsById.get(id);
    if (!warnings) {
      warnings = [];
    }
    warnings.push(warning);
    this.#warningsById.set(id, warnings);
  }

  #getResult(): ConfigsValidationResult {
    if (this.#errorsById.size) {
      const errors: Record<string, string[]> = {};
      this.#errorsById.forEach((values, key) => {
        errors[key] = values;
      });
      return { valid: false, errors };
    }
    return { valid: true };
  }

}
