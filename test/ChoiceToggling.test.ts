import { Form } from '../src/Form';
import { RenderInstructions } from '../src/RenderInstructions';
import { validators, getConfigs } from '.';

const findQuestion = (renderInstructions: RenderInstructions, questionId: string) => {
  for (const question of renderInstructions[0].groups[0].questions) {
    if (question.id === questionId) {
      return question;
    }
  }
  throw new Error();
};

describe('Choice Toggling', () => {

  test('enable', () => {
    const form = Form.fromConfigs(getConfigs(), validators);
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
    const form = Form.fromConfigs(getConfigs(), validators);
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
