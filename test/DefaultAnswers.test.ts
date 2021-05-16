import { Form } from '../src/Form';
import { validators, getConfigs } from '.';

describe('Default Answers', () => {

  const form = Form.fromConfigs(getConfigs(true), validators);

  test('resetAnswer', () => {
    form.resetAnswer('subGroup1Question1');

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('resetGroup', () => {
    form.resetGroup('subGroup1');

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

  test('reset', () => {
    form.reset();

    expect(form.getRenderInstructions()).toMatchSnapshot();
    expect(form.getErrors()).toMatchSnapshot();
    expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    expect(form.getValidatedAnswers()).toMatchSnapshot();
  });

});
