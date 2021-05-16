import { Form } from '../src/Form';
import { validators, getConfigs } from '.';

describe('Basic', () => {

  describe('No Default Answers', () => {

    const form = Form.fromConfigs(getConfigs(), validators);

    test('getConfigs', () => {
      expect(form.getConfigs()).toMatchSnapshot();
    });

    test('getRenderInstructions', () => {
      expect(form.getRenderInstructions()).toMatchSnapshot();
    });

    test('getErrors', () => {
      expect(form.getErrors()).toMatchSnapshot();
    });

    test('getUnvalidatedAnswers', () => {
      expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    });

    test('getValidatedAnswers', () => {
      expect(form.getValidatedAnswers()).toMatchSnapshot();
    });

  });

  describe('With Default Answers', () => {

    const form = Form.fromConfigs(getConfigs(true), validators);

    test('getConfigs', () => {
      expect(form.getConfigs()).toMatchSnapshot();
    });

    test('getRenderInstructions', () => {
      expect(form.getRenderInstructions()).toMatchSnapshot();
    });

    test('getErrors', () => {
      expect(form.getErrors()).toMatchSnapshot();
    });

    test('getUnvalidatedAnswers', () => {
      expect(form.getUnvalidatedAnswers()).toMatchSnapshot();
    });

    test('getValidatedAnswers', () => {
      expect(form.getValidatedAnswers()).toMatchSnapshot();
    });

  });

});
