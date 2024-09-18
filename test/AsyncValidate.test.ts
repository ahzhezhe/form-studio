import { Form } from '../src/Form';
import { Validator } from '../src/Types';
import { validators, getConfigs } from '.';

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

describe('Validate And Get Answers', () => {

  test('Valid answer', async () => {

    const form = new Form(getConfigs(), { validators });

    form.setAny('group1Question1', 'group1Question1Answer');
    form.setChoice('group1Question2', 'group1Question2Choice1');
    form.setAny('subGroup1Question1', 'subGroup1Question1Answer');
    form.setChoice('subGroup1Question2', 'subGroup1Question2Choice1');
    form.setChoices('subGroup1Question3', ['subGroup1Question3Choice1']);
    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1']);
    form.setChoices('subGroup1Question5', ['subGroup1Question5Choice1']);
    form.setChoices('subGroup1Question6', ['subGroup1Question6Choice1']);

    const clean = await form.asyncValidate();
    expect(clean).toBeTruthy();

  });

  test('Invalid answer', async () => {

    const form = new Form(getConfigs(), { validators });

    const clean = await form.asyncValidate();
    expect(clean).toBe(false);

  });

  test('Async valid answer', async () => {

    const form = new Form(getConfigs(), { validators: asyncValidators });

    form.setAny('group1Question1', 'group1Question1Answer');
    form.setChoice('group1Question2', 'group1Question2Choice1');
    form.setAny('subGroup1Question1', 'subGroup1Question1Answer');
    form.setChoice('subGroup1Question2', 'subGroup1Question2Choice1');
    form.setChoices('subGroup1Question3', ['subGroup1Question3Choice1']);
    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1']);
    form.setChoices('subGroup1Question5', ['subGroup1Question5Choice1']);
    form.setChoices('subGroup1Question6', ['subGroup1Question6Choice1']);

    const clean = await form.asyncValidate();
    expect(clean).toBeTruthy();

  });

  test('Async invalid answer', async () => {

    const form = new Form(getConfigs(), { validators: asyncValidators });

    const clean = await form.asyncValidate();
    expect(clean).toBe(false);

  });

});
