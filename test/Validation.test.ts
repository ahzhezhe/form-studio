import { Form } from '../src/Form';
import { validators, getConfigs, answers } from '.';

describe('Validation', () => {

  test('construct with validations', () => {
    const form = new Form(getConfigs(), { validators });

    let isClean = form.isClean();

    expect(isClean).toBeFalsy();

    form.importAnswers(answers);
    isClean = form.isClean();

    expect(isClean).toBeTruthy();
    expect(Object.keys(form.getErrors()).length).toBe(0);
  });

  test('construct without validation', () => {
    const form = new Form(getConfigs(), { validators, validate: false });

    let isClean = form.isClean();

    expect(isClean).toBeTruthy();

    form.validate();
    isClean = form.isClean();

    expect(isClean).toBeFalsy();

    form.importAnswers(answers);
    isClean = form.isClean();

    expect(isClean).toBeTruthy();
    expect(Object.keys(form.getErrors()).length).toBe(0);
  });

  test('setAny with validation', () => {
    const form = new Form(getConfigs(), { validators, validate: false });

    expect(form.getValidatedAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getCurrentAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getError('subGroup1Question1')).toBeFalsy();

    form.setAny('subGroup1Question1', 'subGroup1Question1Answer');

    expect(form.getValidatedAnswer('subGroup1Question1')).toBeTruthy();
    expect(form.getCurrentAnswer('subGroup1Question1')).toBeTruthy();
    expect(form.getError('subGroup1Question1')).toBeFalsy();

    form.setAny('subGroup1Question1', undefined);

    expect(form.getValidatedAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getCurrentAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getError('subGroup1Question1')).toBeTruthy();
  });

  test('setAny without validation', () => {
    const form = new Form(getConfigs(), { validators, validate: false });

    expect(form.getValidatedAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getCurrentAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getError('subGroup1Question1')).toBeFalsy();

    form.setAny('subGroup1Question1', 'subGroup1Question1Answer', { validate: false });

    expect(form.getValidatedAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getCurrentAnswer('subGroup1Question1')).toBeTruthy();
    expect(form.getError('subGroup1Question1')).toBeFalsy();

    form.setAny('subGroup1Question1', undefined, { validate: false });

    expect(form.getValidatedAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getCurrentAnswer('subGroup1Question1')).toBeFalsy();
    expect(form.getError('subGroup1Question1')).toBeFalsy();
  });

});
