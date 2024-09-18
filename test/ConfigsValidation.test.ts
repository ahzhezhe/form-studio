import { Configs } from '../src/Configs';
import { Form } from '../src/Form';

describe('ConfigsValidation', () => {

  test('No groups or questions', () => {
    let configs: Configs = { };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [],
      questions: []
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('No questions', () => {
    let configs: Configs = {
      groups: [{
        questions: []
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{}]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        groups: [{}]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('No choices', () => {
    let configs: Configs = {
      groups: [{
        questions: [
          { type: 'choice' }
        ]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [
          { type: 'choice', choices: [] }
        ]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [
          { type: 'choices' }
        ]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [
          { type: 'choices', choices: [] }
        ]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [
          { type: 'any' }
        ]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Duplicated ids', () => {
    let configs: Configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ id: 'id' }, { id: 'id' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [
          { id: 'id', type: 'any' },
          { id: 'id', type: 'any' }
        ]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        id: 'id',
        questions: [{ type: 'any' }]
      }, {
        id: 'id',
        questions: [{ type: 'any' }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Duplicated choice values', () => {
    let configs: Configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ value: 'value' }, { value: 'value' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ id: 'id' }, { id: 'id' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ id: 'id' }, { value: 'id' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ value: 'a' }, { value: 'b' }]
        }]
      }, {
        questions: [{
          type: 'choice',
          choices: [{ value: 'a' }, { value: 'b' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Unrecognized ids in choices onSelected', () => {
    let configs: Configs = {
      groups: [{
        id: 'g1',
        questions: [{
          id: 'q1',
          type: 'choice',
          choices: [
            { id: 'c1' },
            { id: 'c2', onSelected: { enable: ['xx'] } }
          ]
        }]
      }]
    };
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = {
      groups: [{
        id: 'g1',
        questions: [{
          id: 'q1',
          type: 'choice',
          choices: [
            { id: 'c1' },
            { id: 'c2', onSelected: { disable: ['xx'] } }
          ]
        }]
      }]
    };
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = {
      groups: [{
        id: 'g1',
        questions: [{
          id: 'q1',
          type: 'choice',
          choices: [
            { id: 'c1' },
            { id: 'c2', onSelected: { disable: ['c1'] } }
          ]
        }]
      }]
    };
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();
  });

  test('Duplicated choice values', () => {
    let configs: Configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ value: 'value' }, { value: 'value' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ id: 'id' }, { id: 'id' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ id: 'id' }, { value: 'id' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();

    configs = {
      groups: [{
        questions: [{
          type: 'choice',
          choices: [{ value: 'a' }, { value: 'b' }]
        }]
      }, {
        questions: [{
          type: 'choice',
          choices: [{ value: 'a' }, { value: 'b' }]
        }]
      }]
    };
    expect(Form.validateConfigs(configs)).toMatchSnapshot();
  });

  test('Circular relationship', () => {
    let configs: Configs = {
      groups: [{
        id: 'g1',
        questions: [{
          id: 'q1',
          type: 'choice',
          choices: [
            { id: 'c1', onSelected: { enable: ['c2'] } },
            { id: 'c2', onSelected: { enable: ['c1'] } }
          ]
        }]
      }]
    };
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = {
      groups: [{
        id: 'g1',
        questions: [{
          id: 'q1',
          type: 'choice',
          choices: [
            { id: 'c1' },
            { id: 'c2', onSelected: { enable: ['q1'] } }
          ]
        }]
      }]
    };
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = {
      groups: [{
        id: 'g1',
        questions: [{
          id: 'q1',
          type: 'choice',
          choices: [
            { id: 'c1' },
            { id: 'c2', onSelected: { enable: ['g1'] } }
          ]
        }]
      }]
    };
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();

    configs = {
      groups: [{
        id: 'g1',
        questions: [{
          id: 'q1',
          type: 'choice',
          choices: [
            { id: 'c1', onSelected: { enable: ['c2'] } },
            { id: 'c2' }
          ]
        }]
      }]
    };
    expect(Form.validateConfigs(configs, true)).toMatchSnapshot();
  });

});
