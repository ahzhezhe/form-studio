import { Configs } from '../src/Configs';
import { Form } from '../src/Form';

describe('ConfigsValidation', () => {

  test('No groups', () => {
    const configs: Configs = [];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('No questions', () => {
    let configs: Configs = [{
      questions: []
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{ }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      groups: [{ }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('No choices', () => {
    let configs: Configs = [{
      questions: [{
        type: 'choice'
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choice',
        choices: []
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choices'
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choices',
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
      questions: [{
        type: 'choice',
        choices: [{ id: 'id' }, { id: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        id: 'id',
        type: 'any'
      }, {
        id: 'id',
        type: 'any'
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      id: 'id',
      questions: [{
        type: 'any'
      }]
    }, {
      id: 'id',
      questions: [{
        type: 'any'
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Duplicated choice values', () => {
    let configs: Configs = [{
      questions: [{
        type: 'choice',
        choices: [{ value: 'value' }, { value: 'value' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choice',
        choices: [{ id: 'id' }, { id: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choice',
        choices: [{ id: 'id' }, { value: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choice',
        choices: [{ value: 'a' }, { value: 'b' }]
      }]
    }, {
      questions: [{
        type: 'choice',
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
        type: 'choice',
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
        type: 'choice',
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
        type: 'choice',
        choices: [{ id: 'c1' }, { id: 'c2', onSelected: {
          disable: ['c1']
        } }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();
  });

  test('Duplicated choice values', () => {
    let configs: Configs = [{
      questions: [{
        type: 'choice',
        choices: [{ value: 'value' }, { value: 'value' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choice',
        choices: [{ id: 'id' }, { id: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choice',
        choices: [{ id: 'id' }, { value: 'id' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = [{
      questions: [{
        type: 'choice',
        choices: [{ value: 'a' }, { value: 'b' }]
      }]
    }, {
      questions: [{
        type: 'choice',
        choices: [{ value: 'a' }, { value: 'b' }]
      }]
    }];
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Circular relationship', () => {
    let configs: Configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'choice',
        choices: [{
          id: 'c1', onSelected: {
            enable: ['c2']
          }
        }, {
          id: 'c2', onSelected: {
            enable: ['c1']
          }
        }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'choice',
        choices: [{ id: 'c1' }, { id: 'c2', onSelected: {
          enable: ['q1']
        } }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'choice',
        choices: [{ id: 'c1' }, { id: 'c2', onSelected: {
          enable: ['g1']
        } }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = [{
      id: 'g1',
      questions: [{
        id: 'q1',
        type: 'choice',
        choices: [{ id: 'c1', onSelected: {
          enable: ['c2']
        } }, { id: 'c2' }]
      }]
    }];
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();
  });

});
