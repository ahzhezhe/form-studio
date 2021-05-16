import { GroupConfigs, Configs, QuestionConfigs } from '../src/Configs';
import { RenderInstructions } from '../src/RenderInstructions';
import { Answers, Validator } from '../src/Types';

export const getConfigs = (withDefaultAnswers?: boolean): Configs => {
  const subGroup1Questions: QuestionConfigs[] = [];

  subGroup1Questions.push({
    id: 'subGroup1Question1',
    type: 'any',
    ui: { title: 'subGroup1Questions' },
    validator: 'notNull',
    defaultAnswer: getAnswer('subGroup1Question1', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question2',
    type: 'single',
    ui: { title: 'subGroup1Question2' },
    validator: 'notNullSingle',
    choices: [
      { id: 'subGroup1Question2Choice1', ui: { title: 'subGroup1Question2Choice1' }, onSelected: { enable: ['subGroup1Question3'] } },
      { id: 'subGroup1Question2Choice2', ui: { title: 'subGroup1Question2Choice2' }, onSelected: { disable: ['subGroup1Question4'] } },
      { id: 'subGroup1Question2Choice3', ui: { title: 'subGroup1Question2Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question2', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question3',
    defaultDisabled: true,
    type: 'multiple',
    ui: { title: 'subGroup1Question3' },
    validator: 'atLeast1',
    choices: [
      { id: 'subGroup1Question3Choice1', ui: { title: 'subGroup1Question3Choice1' } },
      { id: 'subGroup1Question3Choice2', ui: { title: 'subGroup1Question3Choice2' } },
      { id: 'subGroup1Question3Choice3', ui: { title: 'subGroup1Question3Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question3', withDefaultAnswers)
  });

  subGroup1Questions.push({
    id: 'subGroup1Question4',
    type: 'multiple',
    ui: { title: 'subGroup1Question3' },
    validator: 'atLeast1',
    choices: [
      { id: 'subGroup1Question4Choice1', ui: { title: 'subGroup1Question4Choice1' } },
      { id: 'subGroup1Question4Choice2', ui: { title: 'subGroup1Question4Choice2' } },
      { id: 'subGroup1Question4Choice3', ui: { title: 'subGroup1Question4Choice3' } }
    ],
    defaultAnswer: getAnswer('subGroup1Question4', withDefaultAnswers)
  });

  const subGroup1: GroupConfigs = {
    id: 'subGroup1',
    questions: subGroup1Questions
  };

  const group1Questions: QuestionConfigs[] = [];

  group1Questions.push({
    id: 'group1Question1',
    order: 1,
    type: 'any',
    ui: { title: 'group1Questions' },
    validator: 'notNull',
    defaultAnswer: getAnswer('group1Question1', withDefaultAnswers)
  });

  group1Questions.push({
    id: 'group1Question3',
    type: 'multiple',
    ui: { title: 'group1Question3' },
    choices: [
      { id: 'group1Question3Choice1', ui: { title: 'group1Question3Choice1' } },
      { id: 'group1Question3Choice2', ui: { title: 'group1Question3Choice2' } },
      { id: 'group1Question3Choice3', ui: { title: 'group1Question3Choice3' } }
    ],
    defaultAnswer: getAnswer('group1Question3', withDefaultAnswers)
  });

  group1Questions.push({
    id: 'group1Question2',
    order: 2,
    type: 'single',
    ui: { title: 'group1Question2' },
    validator: 'notNullSingle',
    choices: [
      { id: 'group1Question2Choice1', ui: { title: 'group1Question2Choice1' } },
      { id: 'group1Question2Choice2', ui: { title: 'group1Question2Choice2' } },
      { id: 'group1Question2Choice3', ui: { title: 'group1Question2Choice3' } }
    ],
    defaultAnswer: getAnswer('group1Question2', withDefaultAnswers)
  });

  const group1: GroupConfigs = {
    id: 'group1',
    groups: [subGroup1],
    questions: group1Questions
  };

  return [group1];
};

export const answers: Answers = {
  subGroup1Question1: 'subGroup1Question1Answer',
  subGroup1Question2: 'subGroup1Question2Choice1',
  subGroup1Question3: ['subGroup1Question3Choice1', 'subGroup1Question3Choice2'],
  subGroup1Question4: ['subGroup1Question4Choice1', 'subGroup1Question4Choice2'],
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
    if (answer.length < 1) {
      throw new Error('Please select at least 1 option.');
    }
  },

  notNullSingle: answer => {
    if (!answer) {
      throw new Error('Please select an option.');
    }
  },

  notNull: answer => {
    if (!answer) {
      throw new Error('This field is required.');
    }
  }
};

export const findQuestion = (renderInstructions: RenderInstructions, questionId: string) => {
  for (const group of renderInstructions) {
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
