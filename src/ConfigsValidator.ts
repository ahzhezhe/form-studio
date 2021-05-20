import { ExportedConfigs } from './ExportedConfigs';
import { ConfigsValidationResult } from './Types';

export class ConfigsValidator {

  private errorsById = new Map<string, string[]>();
  private allIds: string[] = [];
  private choiceValuesByQuestionId = new Map<string, any[]>();
  private onSelectedIdsByChoiceId = new Map<string, string[]>();
  private parentIdsById = new Map<string, string[]>();
  private circularIds: string[] = [];

  validate(configs: ExportedConfigs, strict: boolean): ConfigsValidationResult {
    // Form is not without any groups
    if (configs.length === 0) {
      this.addError('', 'There are no groups');
      return this.getResult();
    }

    // Collect data for subsequent validations
    this.collectData(undefined, configs);

    // No duplicated ids within the form
    const duplicatedIds = this.findDuplicates(this.allIds);
    duplicatedIds.forEach(id => this.addError(id, 'Id is not unique'));

    // No duplicated choice values within a question
    for (const [questionId, values] of this.choiceValuesByQuestionId.entries()) {
      const duplicatedValues = this.findDuplicates(values);
      if (duplicatedValues.length) {
        this.addError(questionId, 'There are choices with same values');
      }
    }

    // No circular choices' `onSelected` configs
    if (!duplicatedIds.length) {
      for (const id of this.allIds) {
        this.checkCircular(id, id);
      }
    }

    if (strict) {
      // No unrecognized ids in choices' `onSelected` configs
      for (const [choiceId, onSelectedIds] of this.onSelectedIdsByChoiceId.entries()) {
        for (const onSelectedId of onSelectedIds) {
          if (!this.allIds.includes(onSelectedId)) {
            this.addError(choiceId, 'There are unrecognized id(s) in onSelected configs');
            break;
          }
        }
      }
    }

    return this.getResult();
  }

  private checkCircular(mainId: string, subId: string) {
    const parentIds = this.parentIdsById.get(subId);

    if (!parentIds) {
      return;
    }

    if (parentIds.includes(mainId)) {
      this.addError(mainId, `Circular relationship with '${subId}'`);
      this.circularIds.push(mainId);
      return;
    }

    for (const parentId of parentIds) {
      if (this.circularIds.includes(parentId)) {
        continue;
      }
      this.checkCircular(mainId, parentId);
    }
  }

  private collectData(parentGroupId: string | undefined, configs: ExportedConfigs) {
    for (const group of configs) {
      this.allIds.push(group.id);
      if (parentGroupId) {
        this.parentIdsById.set(group.id, [parentGroupId]);
      } else {
        this.parentIdsById.set(group.id, []);
      }
      this.collectData(group.id, group.groups);

      // No groups without questions
      if (group.questions.length === 0) {
        this.addError(group.id, 'There are no questions');
        continue;
      }

      for (const question of group.questions) {
        this.allIds.push(question.id);
        this.parentIdsById.set(question.id, [group.id]);

        // No questions with `choice` or `choices` as type without choices
        if (question.type !== 'any') {
          if (question.choices.length === 0) {
            this.addError(group.id, 'There are no choices');
            continue;
          }

          for (const choice of question.choices) {
            this.allIds.push(choice.id);
            this.parentIdsById.set(choice.id, [question.id]);
            const onSelectedIds = [...(choice.onSelected.enable || []), ...(choice.onSelected.disable || [])];
            if (onSelectedIds.length) {
              this.onSelectedIdsByChoiceId.set(choice.id, onSelectedIds);
            }
          }
          this.choiceValuesByQuestionId.set(question.id, question.choices.map(choice => choice.value));
        }
      }
    }

    for (const [choiceId, onSelectedIds] of this.onSelectedIdsByChoiceId) {
      for (const onSelectedId of onSelectedIds) {
        const parentIds = this.parentIdsById.get(onSelectedId);
        if (parentIds) {
          parentIds.push(choiceId);
          this.parentIdsById.set(onSelectedId, parentIds);
        }
      }
    }
  }

  private findDuplicates <T>(arr: T[]) {
    const sorted = arr.slice().sort();
    const duplicatedIds = new Set<T>();
    for (let i = 0; i < sorted.length - 1; i++) {
      if (sorted[i + 1] === sorted[i]) {
        duplicatedIds.add(sorted[i]);
      }
    }
    return Array.from(duplicatedIds);
  }

  private addError(id: string, error: string) {
    let errors = this.errorsById.get(id);
    if (!errors) {
      errors = [];
    }
    errors.push(error);
    this.errorsById.set(id, errors);
  }

  private getResult(): ConfigsValidationResult {
    if (this.errorsById.size) {
      const errors: Record<string, string[]> = {};
      this.errorsById.forEach((values, key) => {
        errors[key] = values;
      });
      return { pass: false, errors };
    }
    return { pass: true };
  }

}
