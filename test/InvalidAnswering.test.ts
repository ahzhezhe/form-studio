import { Form } from '../src/Form';
import { validators, getConfigs } from '.';

describe('Invalid Answering', () => {

  const form = new Form(getConfigs(), validators);

  test('setAnswer undefined answer', () => {
    form.setAnswer('subGroup1Question1', undefined);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoice undefined answer', () => {
    form.setChoice('subGroup1Question2', undefined);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoices empty answer', () => {
    form.setChoices('subGroup1Question3', []);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setAnswer invalid question', () => {
    expect(() => form.setAnswer('invalid', 'subGroup1Question1Answer')).toThrow();
  });

  test('setChoice invalid question', () => {
    expect(() => form.setChoice('invalid', 'subGroup1Question2Choice1')).toThrow();
  });

  test('setChoices invalid question', () => {
    expect(() => form.setChoices('invalid', ['subGroup1Question3Choice1', 'subGroup1Question3Choice2'])).toThrow();
  });

  test('setChoice invalid choice', () => {
    form.setChoice('subGroup1Question2', 'invalid');

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoices invalid choice', () => {
    form.setChoices('subGroup1Question3', ['invalid']);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('selectChoice invalid choice', () => {
    expect(() => form.selectChoice('invalid', true)).toThrow();
  });

  test('setAnswer invalid question type', () => {
    expect(() => form.setAnswer('subGroup1Question2', 'subGroup1Question2Value')).toThrow();
  });

  test('setChoice invalid question type', () => {
    expect(() => form.setChoice('subGroup1Question1', 'subGroup1Question1Choice1')).toThrow();
  });

  test('setChoices invalid question type', () => {
    expect(() => form.setChoices('subGroup1Question1', ['subGroup1Question1Choice1', 'subGroup1Question1Choice2'])).toThrow();
  });

  test('clearGroup invalid group', () => {
    expect(() => form.clearGroup('invalid')).toThrow();
  });

  test('clearAnswer invalid question', () => {
    expect(() => form.clearAnswer('invalid')).toThrow();
  });

  test('resetGroup invalid group', () => {
    expect(() => form.resetGroup('invalid')).toThrow();
  });

  test('resetAnswer invalid question', () => {
    expect(() => form.resetAnswer('invalid')).toThrow();
  });

});
