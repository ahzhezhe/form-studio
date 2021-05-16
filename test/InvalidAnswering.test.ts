import { Form } from '../src/Form';
import { validators, getConfigs } from '.';

describe('Invalid Answering', () => {

  const form = Form.fromConfigs(getConfigs(), validators);

  test('setInput undefined value', () => {
    form.setInput('subGroup1Question1', undefined);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoice undefined value', () => {
    form.setChoice('subGroup1Question2', undefined);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoices empty value', () => {
    form.setChoices('subGroup1Question3', []);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setInput invalid question', () => {
    expect(() => form.setInput('invalid', 'subGroup1Question1Input')).toThrow();
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
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoices invalid choice', () => {
    form.setChoices('subGroup1Question3', ['invalid']);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('selectChoice invalid choice', () => {
    expect(() => form.selectChoice('invalid', true)).toThrow();
  });

  test('setInput invalid question type', () => {
    expect(() => form.setInput('subGroup1Question2', 'subGroup1Question2Input')).toThrow();
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
