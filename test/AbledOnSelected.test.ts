import { Form } from '../src/Form';
import { validators, getConfigs, findQuestion } from '.';

describe('Enabled/Disabled On Selected', () => {

  test('enabledOnSelected', () => {
    const form = new Form(getConfigs(), { validators });
    let question = findQuestion(form.getRenderInstructions(), 'subGroup1Question7');

    expect(question.disabled).toBe(true);

    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question8');

    expect(question.disabled).toBe(true);

    // ---

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question7');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question7');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question7');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question7');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question7');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question7');

    expect(question.disabled).toBe(false);

    // ---

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question8');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question8');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question8');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question8');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question8');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question8');

    expect(question.disabled).toBe(false);
  });

  test('disabledOnSelected', () => {
    const form = new Form(getConfigs(), { validators });
    let question = findQuestion(form.getRenderInstructions(), 'subGroup1Question5');

    expect(question.disabled).toBe(false);

    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question6');

    expect(question.disabled).toBe(false);

    // ---

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question5');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question5');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question5');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question5');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question5');

    expect(question.disabled).toBe(true);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question5');

    expect(question.disabled).toBe(true);

    // ---

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question6');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question6');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question6');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice2']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question6');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice1', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question6');

    expect(question.disabled).toBe(false);

    form.setChoices('subGroup1Question4', ['subGroup1Question4Choice2', 'subGroup1Question4Choice3']);
    question = findQuestion(form.getRenderInstructions(), 'subGroup1Question6');

    expect(question.disabled).toBe(true);
  });

});
