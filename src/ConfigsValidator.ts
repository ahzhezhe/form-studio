import { ExportedConfigs } from './ExportedConfigs';
import { ConfigsValidationResult } from './Types';

export class ConfigsValidator {

  private errorsById = new Map<string, string[]>();
  private allIds: string[] = [];
  private choiceValuesByQuestionId = new Map<string, any[]>();
  private onSelectedIdsByChoiceId = new Map<string, string[]>();

  validate(configs: ExportedConfigs, strict: boolean): ConfigsValidationResult {
    if (configs.length === 0) {
      this.addError('', 'There are no groups');
      return this.getResult();
    }

    this.collectData(configs);

    const duplicatedIds = this.findDuplicates(this.allIds);
    duplicatedIds.forEach(id => this.addError(id, 'Id is not unique'));

    for (const [questionId, values] of this.choiceValuesByQuestionId.entries()) {
      const duplicatedValues = this.findDuplicates(values);
      if (duplicatedValues.length) {
        this.addError(questionId, 'There are choices with same values');
      }
    }

    if (strict) {
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

  private collectData(configs: ExportedConfigs) {
    for (const group of configs) {
      this.allIds.push(group.id);
      this.collectData(group.groups);

      if (group.questions.length === 0) {
        this.addError(group.id, 'There are no questions');
        continue;
      }

      for (const question of group.questions) {
        this.allIds.push(question.id);

        if (question.type !== 'any') {
          if (question.choices.length === 0) {
            this.addError(group.id, 'There are no choices');
            continue;
          }

          for (const choice of question.choices) {
            this.allIds.push(choice.id);
            const onSelectedIds = [...(choice.onSelected.enable || []), ...(choice.onSelected.disable || [])];
            if (onSelectedIds.length) {
              this.onSelectedIdsByChoiceId.set(choice.id, onSelectedIds);
            }
          }
          this.choiceValuesByQuestionId.set(question.id, question.choices.map(choice => choice.value));
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
