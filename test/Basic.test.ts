import { Form } from '../src/Form';
import { validators, getConfigs } from '.';

describe('Basic', () => {

  describe('No Default Answers', () => {

    const form = new Form(getConfigs(), validators);

    test('getConfigs', () => {
      expect(form.getConfigs()).toMatchSnapshot();
    });

    test('getRenderInstructions', () => {
      expect(form.getRenderInstructions()).toMatchSnapshot();
    });

    test('getErrors', () => {
      expect(form.getErrors()).toMatchSnapshot();
    });

    test('getCurrentAnswers', () => {
      expect(form.getCurrentAnswers()).toMatchSnapshot();
    });

    test('getValidatedAnswers', () => {
      expect(form.getValidatedAnswers()).toMatchSnapshot();
    });

  });

  describe('With Default Answers', () => {

    const form = new Form(getConfigs(true), validators);

    test('getConfigs', () => {
      expect(form.getConfigs()).toMatchSnapshot();
    });

    test('getRenderInstructions', () => {
      expect(form.getRenderInstructions()).toMatchSnapshot();
    });

    test('getErrors', () => {
      expect(form.getErrors()).toMatchSnapshot();
    });

    test('getCurrentAnswers', () => {
      expect(form.getCurrentAnswers()).toMatchSnapshot();
    });

    test('getValidatedAnswers', () => {
      expect(form.getValidatedAnswers()).toMatchSnapshot();
    });

  });

});
