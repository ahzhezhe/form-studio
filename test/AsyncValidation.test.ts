import { Validator } from '../src';
import { Form } from '../src/Form';
import { validators, getConfigs, findQuestion } from '.';

const sleep = (milliseconds: number) => new Promise(resolve => setTimeout(resolve, milliseconds));

const asyncValidators: Record<string, Validator> = {
  ...validators,

  notNull: async value => {
    await sleep(100);
    if (!value) {
      throw new Error('This field is required.');
    }
  }
};

describe('Aysnc Validation', () => {

  test('Valid answer', async () => {

    const form = Form.fromConfigs(getConfigs(), asyncValidators, true);

    form.setValue('subGroup1Question1', 'subGroup1Question1Value');
    let question = findQuestion(form.getRenderInstructions(), 'subGroup1Question1');

    expect(question.validating).toBe(true);
    expect(question.currentAnswer).toBe('subGroup1Question1Value');
    expect(question.validatedAnswer).toBeUndefined();
    expect(question.error).toBeUndefined();

    await sleep(200);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question1');

    expect(question.validating).toBe(false);
    expect(question.currentAnswer).toBe('subGroup1Question1Value');
    expect(question.validatedAnswer).toBe('subGroup1Question1Value');
    expect(question.error).toBeUndefined();

  });

  test('Invalid answer', async () => {

    const form = Form.fromConfigs(getConfigs(), asyncValidators, true);

    form.setValue('subGroup1Question1', undefined);
    let question = findQuestion(form.getRenderInstructions(), 'subGroup1Question1');

    expect(question.validating).toBe(true);
    expect(question.currentAnswer).toBeUndefined();
    expect(question.validatedAnswer).toBeUndefined();
    expect(question.error).toBeUndefined();

    await sleep(200);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question1');

    expect(question.validating).toBe(false);
    expect(question.currentAnswer).toBeUndefined();
    expect(question.validatedAnswer).toBeUndefined();
    expect(question.error).toBeDefined();

  });

});
