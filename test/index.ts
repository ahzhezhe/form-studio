import { GroupConfigs, Configs, QuestionConfigs } from '../src/Configs';
import { RenderInstructions } from '../src/RenderInstructions';
import { Answers, Validator } from '../src/Types';

export const getConfigs = (withDefaultAnswers?: boolean): Configs => {
  const subGroup1Questions: QuestionConfigs[] = [];

  subGroup1Questions.push({
    id: 'subGroup1Question1',
    type: 'any',
    custom: { title: 'subGroup1Questions' },
    validators: ['notNull'],
    defaultAnswer: getAnswer('subGroup1Question1', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question2',
    type: 'choice',
    custom: { title: 'subGroup1Question2' },
    validators: ['notNullSingle'],
    choices: [
      { id: 'subGroup1Question2Choice1', custom: { title: 'subGroup1Question2Choice1' }, onSelected: { enable: ['subGroup1Question3'] } },
      { id: 'subGroup1Question2Choice2', custom: { title: 'subGroup1Question2Choice2' }, onSelected: { disable: ['subGroup1Question4'] } },
      { id: 'subGroup1Question2Choice3', custom: { title: 'subGroup1Question2Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question2', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question3',
    defaultDisabled: true,
    type: 'choices',
    custom: { title: 'subGroup1Question3' },
    validators: ['atLeast1'],
    choices: [
      { id: 'subGroup1Question3Choice1', custom: { title: 'subGroup1Question3Choice1' } },
      { id: 'subGroup1Question3Choice2', custom: { title: 'subGroup1Question3Choice2' } },
      { id: 'subGroup1Question3Choice3', custom: { title: 'subGroup1Question3Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question3', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question4',
    type: 'choices',
    custom: { title: 'subGroup1Question3' },
    validators: ['atLeast1'],
    choices: [
      { id: 'subGroup1Question4Choice1', custom: { title: 'subGroup1Question4Choice1' } },
      { id: 'subGroup1Question4Choice2', custom: { title: 'subGroup1Question4Choice2' } },
      { id: 'subGroup1Question4Choice3', custom: { title: 'subGroup1Question4Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question4', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question5',
    type: 'choices',
    custom: { title: 'subGroup1Question5' },
    validators: ['atLeast1'],
    disabledWhen: [['subGroup1Question4Choice2'], ['subGroup1Question4Choice3']],
    choices: [
      { id: 'subGroup1Question5Choice1', custom: { title: 'subGroup1Question5Choice1' } },
      { id: 'subGroup1Question5Choice2', custom: { title: 'subGroup1Question5Choice2' } },
      { id: 'subGroup1Question5Choice3', custom: { title: 'subGroup1Question5Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question5', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question6',
    type: 'choices',
    custom: { title: 'subGroup1Question6' },
    validators: ['atLeast1'],
    disabledWhen: [['subGroup1Question4Choice2', 'subGroup1Question4Choice3']],
    choices: [
      { id: 'subGroup1Question6Choice1', custom: { title: 'subGroup1Question6Choice1' } },
      { id: 'subGroup1Question6Choice2', custom: { title: 'subGroup1Question6Choice2' } },
      { id: 'subGroup1Question6Choice3', custom: { title: 'subGroup1Question6Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question6', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question7',
    type: 'choices',
    custom: { title: 'subGroup1Question7' },
    validators: ['atLeast1'],
    defaultDisabled: true,
    enabledWhen: [['subGroup1Question4Choice2'], ['subGroup1Question4Choice3']],
    choices: [
      { id: 'subGroup1Question7Choice1', custom: { title: 'subGroup1Question7Choice1' } },
      { id: 'subGroup1Question7Choice2', custom: { title: 'subGroup1Question7Choice2' } },
      { id: 'subGroup1Question7Choice3', custom: { title: 'subGroup1Question7Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question7', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question8',
    type: 'choices',
    custom: { title: 'subGroup1Question8' },
    validators: ['atLeast1'],
    defaultDisabled: true,
    enabledWhen: [['subGroup1Question4Choice2', 'subGroup1Question4Choice3']],
    choices: [
      { id: 'subGroup1Question8Choice1', custom: { title: 'subGroup1Question8Choice1' } },
      { id: 'subGroup1Question8Choice2', custom: { title: 'subGroup1Question8Choice2' } },
      { id: 'subGroup1Question8Choice3', custom: { title: 'subGroup1Question8Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question8', withDefaultAnswers)
  });

  const subGroup1: GroupConfigs = {
    id: 'subGroup1',
    questions: subGroup1Questions
  };

  const group1Questions: QuestionConfigs[] = [];

  group1Questions.push({
    id: 'group1Question1',
    type: 'any',
    custom: { title: 'group1Questions' },
    validators: ['notNull'],
    defaultAnswer: getAnswer('group1Question1', withDefaultAnswers)
  });

  group1Questions.push({
    id: 'group1Question2',
    type: 'choice',
    custom: { title: 'group1Question2' },
    validators: ['notNullSingle'],
    choices: [
      { id: 'group1Question2Choice1', custom: { title: 'group1Question2Choice1' } },
      { id: 'group1Question2Choice2', custom: { title: 'group1Question2Choice2' } },
      { id: 'group1Question2Choice3', custom: { title: 'group1Question2Choice3' } }
    ],
    defaultAnswer: getAnswer('group1Question2', withDefaultAnswers)
  });

  group1Questions.push({
    id: 'group1Question3',
    type: 'choices',
    custom: { title: 'group1Question3' },
    choices: [
      { id: 'group1Question3Choice1', custom: { title: 'group1Question3Choice1' } },
      { id: 'group1Question3Choice2', custom: { title: 'group1Question3Choice2' } },
      { id: 'group1Question3Choice3', custom: { title: 'group1Question3Choice3' } }
    ],
    defaultAnswer: getAnswer('group1Question3', withDefaultAnswers)
  });

  const group1: GroupConfigs = {
    id: 'group1',
    groups: [subGroup1],
    questions: group1Questions
  };

  return {
    groups: [group1]
  };
};

export const answers: Answers = {
  subGroup1Question1: 'subGroup1Question1Answer',
  subGroup1Question2: 'subGroup1Question2Choice1',
  subGroup1Question3: ['subGroup1Question3Choice1', 'subGroup1Question3Choice2'],
  subGroup1Question4: ['subGroup1Question4Choice1', 'subGroup1Question4Choice2'],
  subGroup1Question5: ['subGroup1Question5Choice1', 'subGroup1Question5Choice2'],
  subGroup1Question6: ['subGroup1Question6Choice1', 'subGroup1Question6Choice2'],
  subGroup1Question7: ['subGroup1Question7Choice1', 'subGroup1Question7Choice2'],
  subGroup1Question8: ['subGroup1Question8Choice1', 'subGroup1Question8Choice2'],
  group1Question1: 'group1Question1Answer',
  group1Question2: 'group1Question2Choice1',
  group1Question3: ['group1Question3Choice1', 'group1Question3Choice2']
};

const getAnswer = (questionId: string, withDefaultAnswers?: boolean) => {
  if (!withDefaultAnswers) {
    return undefined;
  }
  return answers[questionId];
};

export const validators: Record<string, Validator> = {
  atLeast1: answer => {
    if (!Array.isArray(answer)) {
      throw 'Answer must be an array.';
    }
    if (answer.length < 1) {
      throw 'Please select at least 1 option.';
    }
  },

  notNullSingle: answer => {
    if (!answer) {
      throw 'Please select an option.';
    }
  },

  notNull: answer => {
    if (!answer) {
      throw 'This field is required.';
    }
  }
};

export const findQuestion = (renderInstructions: RenderInstructions, questionId: string) => {
  for (const group of renderInstructions.groups) {
    for (const subGroup of group.groups) {
      for (const question of subGroup.questions) {
        if (question.id === questionId) {
          return question;
        }
      }
    }
    for (const question of group.questions) {
      if (question.id === questionId) {
        return question;
      }
    }
  }
  throw new Error();
};
