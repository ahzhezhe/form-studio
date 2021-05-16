import { Form } from '../src/Form';
import { validators, getConfigs, answers } from '.';

describe('Validation', () => {

  test('construct with validations', () => {
    const form = Form.fromConfigs(getConfigs(), validators);

    expect(form.isClean()).toBeFalsy();

    form.importAnswers(answers);
    form.validate();

    expect(form.isClean()).toBeTruthy();
    expect(Object.keys(form.getErrors()).length).toBe(0);
  });

  test('construct skip validations', () => {
    const form = Form.fromConfigs(getConfigs(), validators, true);

    expect(form.isClean()).toBeTruthy();

    form.validate();

    expect(form.isClean()).toBeFalsy();

    form.importAnswers(answers);
    form.validate();

    expect(form.isClean()).toBeTruthy();
    expect(Object.keys(form.getErrors()).length).toBe(0);
  });

  test('setValue with validation', () => {
    const form = Form.fromConfigs(getConfigs(), validators, true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setValue('subGroup1Question1', 'subGroup1Question1Value');

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeTruthy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeTruthy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setValue('subGroup1Question1', undefined);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeTruthy();
  });

  test('setValue skip validation', () => {
    const form = Form.fromConfigs(getConfigs(), validators, true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setValue('subGroup1Question1', 'subGroup1Question1Value', true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeTruthy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();

    form.setValue('subGroup1Question1', undefined, true);

    expect(form.getValidatedAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getCurrentAnswers()['subGroup1Question1']).toBeFalsy();
    expect(form.getErrors()['subGroup1Question1']).toBeFalsy();
  });

});
