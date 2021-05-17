import { Form } from '../src/Form';
import { validators, getConfigs, answers } from '.';

describe('Validation', () => {

  test('construct with validations', () => {
    const form = new Form(getConfigs(), validators);

    expect(form.isClean()).toBeFalsy();

    form.importAnswers(answers);
    form.validate();

    expect(form.isClean()).toBeTruthy();
    expect(Object.keys(form.getErrors()).length).toBe(0);
  });

  test('construct skip validations', () => {
    const form = new Form(getConfigs(), validators, true);

    expect(form.isClean()).toBeTruthy();

    form.validate();

    expect(form.isClean()).toBeFalsy();

    form.importAnswers(answers);
    form.validate();

    expect(form.isClean()).toBeTruthy();
    expect(Object.keys(form.getErrors()).length).toBe(0);
  });

  test('setAnswer with validation', () => {
    const form = new Form(getConfigs(), validators, true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setAnswer('subGroup1Question1', 'subGroup1Question1Answer');

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeTruthy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeTruthy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setAnswer('subGroup1Question1', undefined);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeTruthy();
  });

  test('setAnswer skip validation', () => {
    const form = new Form(getConfigs(), validators, true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setAnswer('subGroup1Question1', 'subGroup1Question1Answer', true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeTruthy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setAnswer('subGroup1Question1', undefined, true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();
  });

});
