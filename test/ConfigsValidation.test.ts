import { Configs } from '../src/Configs';
import { Form } from '../src/Form';

describe('ConfigsValidation', () => {

  test('No groups', () => {
    const configs: Configs = [];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('No questions', () => {
    const configs: Configs = [{
      questions: []
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('No choices', () => {
    let configs: Configs = [{
      questions: [{
        type: 'single'
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'single',
        choices: []
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'multiple'
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'multiple',
        choices: []
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'any'
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Duplicated ids', () => {
    let configs: Configs = [{
      id: 'id',
      questions: [{
        id: 'id',
        type: 'single',
        choices: [{ id: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      id: 'id',
      questions: [{
        id: 'id',
        type: 'single',
        choices: [{ }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      id: 'id',
      questions: [{
        type: 'single',
        choices: [{ id: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        id: 'id',
        type: 'single',
        choices: [{ id: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Duplicated choice values', () => {
    let configs: Configs = [{
      questions: [{
        type: 'single',
        choices: [{ value: 'value' }, { value: 'value' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'single',
        choices: [{ id: 'id' }, { id: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'single',
        choices: [{ id: 'id' }, { value: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'single',
        choices: [{ value: 'a' }, { value: 'b' }]
      }]
    }, {
      questions: [{
        type: 'single',
        choices: [{ value: 'a' }, { value: 'b' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Unrecognized ids in choices onSelected', () => {
    let configs: Configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'single',
        choices: [{ id: 'c1' }, { id: 'c2', onSelected: {
          enable: ['xx']
        } }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'single',
        choices: [{ id: 'c1' }, { id: 'c2', onSelected: {
          disable: ['xx']
        } }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'single',
        choices: [{ id: 'c1' }, { id: 'c2', onSelected: {
          disable: ['g1', 'q1', 'c1']
        } }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'single',
        choices: [{ id: 'c1' }, { id: 'c2', onSelected: {
          disable: ['xx']
        } }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

});
