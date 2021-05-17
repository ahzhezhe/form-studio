import { Form } from '../src/Form';
import { validators, answers, getConfigs } from '.';

describe('Answering', () => {

  const form = new Form(getConfigs(), validators);

  test('setAnswer', () => {
    form.setAnswer('subGroup1Question1', 'subGroup1Question1Answer');

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoice', () => {
    form.setChoice('subGroup1Question2', 'subGroup1Question2Choice1');

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('setChoices', () => {
    form.setChoices('subGroup1Question3', ['subGroup1Question3Choice1', 'subGroup1Question3Choice2']);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('selectChoice single', () => {
    form.selectChoice('subGroup1Question2Choice2', true);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();

    form.selectChoice('subGroup1Question2Choice2', false);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('selectChoice multiple', () => {
    form.selectChoice('subGroup1Question3Choice1', true);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();

    form.selectChoice('subGroup1Question3Choice1', false);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('importAnswers', () => {
    form.importAnswers(answers);

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('clearAnswer', () => {
    form.clearAnswer('subGroup1Question1');

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('clearGroup', () => {
    form.clearGroup('subGroup1');

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('clear', () => {
    form.clear();

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getCurrentAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

});
