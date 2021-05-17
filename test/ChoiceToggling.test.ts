import { Form } from '../src/Form';
import { validators, getConfigs, findQuestion } from '.';

describe('Choice Toggling', () => {

  test('enable', () => {
    const form = new Form(getConfigs(), validators);
    let question = findQuestion(form.getRenderInstructions(), 'subGroup1Question3');

    expect(question.disabled).toBe(true);

    form.setChoice('subGroup1Question2', 'subGroup1Question2Choice1');
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question3');

    expect(question.disabled).toBe(false);

    form.setChoice('subGroup1Question2', 'subGroup1Question2Choice2');
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question3');

    expect(question.disabled).toBe(true);
  });

  test('disable', () => {
    const form = new Form(getConfigs(), validators);
    let question = findQuestion(form.getRenderInstructions(), 'subGroup1Question4');

    expect(question.disabled).toBe(false);

    form.setChoice('subGroup1Question2', 'subGroup1Question2Choice2');
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question4');

    expect(question.disabled).toBe(true);

    form.setChoice('subGroup1Question2', 'subGroup1Question2Choice1');
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question4');

    expect(question.disabled).toBe(false);
  });

});
