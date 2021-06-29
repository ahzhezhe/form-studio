import { Form } from '../src/Form';
import { validators, getConfigs, answers } from '.';

test('Form Update Event', () => {

  const onFormUpdate = () => {
    expect(true).toBeTruthy();
  };

  const form = new Form(getConfigs(), { validators, onFormUpdate });
  expect.assertions(1);

  form.setAnswer('subGroup1Question1', 'subGroup1Question1Answer');
  expect.assertions(2);

  form.setAny('subGroup1Question1', 'subGroup1Question1Answer');
  expect.assertions(3);

  form.setChoice('subGroup1Question2', 'subGroup1Question2Choice1');
  expect.assertions(4);

  form.setChoices('subGroup1Question3', ['subGroup1Question3Choice1', 'subGroup1Question3Choice2']);
  expect.assertions(5);

  form.selectChoice('subGroup1Question2Choice2', true);
  expect.assertions(6);

  form.selectChoice('subGroup1Question3Choice1', true);
  expect.assertions(7);

  form.importAnswers(answers);
  expect.assertions(8);

  form.clearAnswer('subGroup1Question1');
  expect.assertions(9);

  form.clearGroup('subGroup1');
  expect.assertions(10);

  form.clear();
  expect.assertions(11);

  form.resetAnswer('subGroup1Question1');
  expect.assertions(12);

  form.resetGroup('subGroup1');
  expect.assertions(13);

  form.reset();
  expect.assertions(14);

  form.validate();
  expect.assertions(15);

});
