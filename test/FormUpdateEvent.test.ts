import { Form } from '../src/Form';
import { validators, getConfigs } from '.';

test('Form Update Event', () => {

  const onFormUpdate = () => {
    expect(true).toBeTruthy();
  };

  Form.fromConfigs(getConfigs(), validators, true, onFormUpdate);

  expect.hasAssertions();

});
