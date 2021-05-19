# **form-studio**
[![npm package](https://img.shields.io/npm/v/form-studio)](https://www.npmjs.com/package/form-studio)
[![npm downloads](https://img.shields.io/npm/dt/form-studio)](https://www.npmjs.com/package/form-studio)
[![GitHub test](https://github.com/ahzhezhe/form-studio/workflows/test/badge.svg?branch=master)](https://github.com/ahzhezhe/form-studio)
[![GitHub issues](https://img.shields.io/github/issues/ahzhezhe/form-studio)](https://github.com/ahzhezhe/form-studio/issues)
[![GitHub license](https://img.shields.io/github/license/ahzhezhe/form-studio)](https://github.com/ahzhezhe/form-studio/blob/master/LICENSE)

### **`Disclaimer`**`: This library is still under development phase, it might have breaking changes even if there is no major version increase.`

<br />

## **What is form-studio?**
It is a tool that helps design, create and manage form / survey / questionnaire through simple JSON configurations.

It provides:
- Data structure for form configurations and answers.
- Conditionally disabling/enabling questions based on choices made in another question.
- Answer validation mechanism.
- Instructions for rendering the UI based on current status of the form.

It does not provide:
- Any UI components, define your own UI configurations that suit your project needs and render the UI according to your own design system.
- Validators, define your own validators that suit your project needs.

[API Documentation](https://ahzhezhe.github.io/docs/form-studio-v0.0/index.html)

[Demo](https://github.com/ahzhezhe/form-studio-demo)

<br />

## **Install via NPM**
```
npm install form-studio
```

<br />

## **Import**
```javascript
import Form from 'form-studio';
```
or
```javascript
const FormStudio = require('form-studio');
const { default: Form } = FormStudio;
```

<br />

# **Form Configs**
Form configs is the definition of the form. It should be persisted somewhere (e.g. database) so that it can be reused later.

There are 3 types of items in a configs: `Group`, `Question` and `Choice`.

Each of them has the following properties:
- `id`: An unique id to identify the item
- `order`: Sort order of the item among it's parent
- `defaultDisabled`: To indicate that the item is disabled by default
- `ui`: Any values that help you determine on how to render the frontend UI for this item, it should contain minimal but useful information, e.g. title, placeholder

### **Group**
A group is a logical grouping of a set of questions.

A form needs at least 1 group.

Groups can also have sub-groups.

### **Question**
There are 3 types of questions: `any`, `single` and `multiple`.

A question comes with an answer (could be undefined if it is unanswered) and an error (could be undefined if it is unanswered, unvalidated or passed validation).

`any` questions accept `any` value as an answer.

`single` questions accept a choice value as an answer.

`multiple` questions accept a list of choice values as an answer.

`single` and `multiple` questions need to have 1 or more choices.

You can also define the validators to be used by a question to validate its answer.

### **Choice**
Choices are for `single` or `multiple` questions.

A choice comes with a value. Value of the choices will be the answer of the question.

A choice has the ability to disable/enable other groups/questions/choices when it's selected/unselected.

### **Example**
The following example consists of 1 group and 2 questions under it.

The second question is disabled by default. If 'yes' is selected for the first question, the second question will be enabled.

```json
[
  {
    "questions": [
      {
        "id": "proceed",
        "type": "single",
        "ui": {
          "title": "Would you like to proceed?"
        },
        "choices": [
          {
            "value": "yes",
            "ui": {
              "title": "Yes"
            },
            "onSelected": {
              "enable": [
                "name"
              ]
            }
          },
          {
            "value": "no",
            "ui": {
              "title": "No"
            }
          }
        ],
      },
      {
        "id": "name",
        "defaultDisabled": true,
        "type": "any",
        "ui": {
          "type": "string",
          "title": "What is you name?",
        },
      }
    ]
  }
]
```

### **Validate Configs**
You can call `validateConfigs` method to validate your configs.

```
Form.validateConfigs(configs);
```

<br />

# **Validators**
`form-studio` doesn't come with any predefined validator. You need to define your own validators according to your project needs.

A validator is a function that will be called when the answer of a question is updated, it throws error when validation fails.

Each question can be assigned with a name of the validator to be used and a set of validation configs to be used by the validator.

### **Example**
```javascript
const validators = {
  atLeast1: answer => {
    if (answer.length < 1) {
      throw new Error('Please select at least 1 option.');
    }
  },

  notNull: answer => {
    if (!answer) {
      throw new Error('This question cannot be left unanswered.');
    }
  },

  number: (answer, validation) => {
    const { min, max } = validation;
    if (answer < min){
      throw new Error('Please enter no less than ' + min + '.');
    }
    if (answer > max){
      throw new Error('Please enter no greater than ' + max + '.');
    }
  }
};
```

<br />

# **Form Update Listener**
A listener function that will be called when form is updated.

Form will be updated when answer is set, validation is triggered, etc.

Usually form updated listener is only needed when the form is being used in frontend, so that you can trigger an UI rerender when form is updated.

### **Example (React)**
```javascript
const [renderInstructions, setRenderInstructions] = useState();

const onFormUpdate = form => setRenderInstructions(form.getRenderInstructions());
```

<br />

# **Construct a Form with Configs & Validators**
```javascript
const form = new Form(configs, validators, onFormUpdate);
```

<br />

# **Render Instructions**
Render instructions can be get by calling `getRenderInstructions` method.

It is a set of instructions that tell you how the form should look like.

Each item in the instructions comes with the following properties:
- `id`: An unique id to identify the item
- `disabled`: Whether or not this item is disabled, you should handle it in the UI, e.g. hide or grey out disabled item
- `ui`: The exact same values that you specified in the form configs

Questions also come with the following important properties that you will need to determine the UI:
- `type`:
  - `any`: render whatever UI that is required based on your custom `ui` config, e.g. if `ui.inputType` is `string`, then a simple text input is rendered
  - `single`: render UI that allows user to select 1 option from a list of options, e.g. select, radio button group
  - `multiple`: render UI that allows user to select multiple options from a list of options, e.g. check box group
- `currentAnswer`: current answer of the question, it is unvalidated and might not be valid, but you will still need to show them on UI
- `validatedAnswer`: validated answer
- `validating`: whether or not the question is currently being validating, it could happen if the validator used is an aysnc function, you might want to show a spinner or some other indicator on UI
- `error`: error for question which failed validation

### **Example (React)**
```javascript
let form: Form;

export const SurveyPage = () => {
  const [renderInstructions, setRenderInstructions] = useState<GroupRenderInstructions[]>([]);

  useEffect(() => {
    form = new Form(configs, validators, true, form => setRenderInstructions(form.getRenderInstructions()));
  }, []);

  const renderQuestion = (question: QuestionRenderInstructions) => {
    const { disabled, type, ui } = question;
    if (disabled) {
      return null;
    }
    if (type === 'any') {
      return (
        <>
          {ui.inputType === 'string' && renderStringInput(question)}
        </>
      );
    }
    if (type === 'single') {
      return renderRadioGroup(question);
    }
    if (type === 'multiple') {
      return renderCheckBoxGroup(question);
    }
  };

  const renderRadioGroup = (question: QuestionRenderInstructions) => {
    const { id, choices, error, currentAnswer } = question;
    return (
      <RadioGroup
        error={error}
        value={currentAnswer}
        onChange={e => form.setChoice(id, e.target.value)}>
        {choices!.map(choice =>
          <Radio
            value={choice.value}
            disabled={choice.disabled}>
            {choice.ui.title}
          </Radio>
        )}
      </RadioGroup>
    );
  };

  const renderCheckBoxGroup = (question: QuestionRenderInstructions) => {
    const { id, choices, error, currentAnswer } = question;
    return (
      <CheckBoxGroup
        error={error}
        value={currentAnswer}
        onChange={answer => form.setChoices(id, answer as any[])}>
        {choices!.map(choice =>
          <CheckBox
            value={choice.value}
            disabled={choice.disabled}>
            {choice.ui.title}
          </CheckBox>
        )}
      </CheckBoxGroup>
    );
  };

  const renderStringInput = (question: QuestionRenderInstructions) => {
    const { id, ui, currentAnswer, error } = question;
    return (
      <TextInput
        error={error}
        maxLength={ui.maxLength as number}
        value={currentAnswer}
        onChange={e => form.setAnswer(id, e.target.value)} />
    );
  };

  return renderInstructions[0].questions.map(question => renderQuestion(question));
};
```

<br />

# **Setting Answers**
`any` questions use `setAnswer` method to set answer.

`single` questions use `setChoice` or `selectChoice` method to set answer.

`multiple` questions use `setChoices` or `selectChoice` method to set answer.

### **Example (General)**
```javascript
form.setChoice('proceed', 'yes');
form.setAnswer('name', 'Jason');
```

### **Example (Frontend)**
```javascript
onChange={e => form.setChoice(id, e.target.value)}
onChange={e => form.setAnswer(id, e.target.value)}
```

<br />

# **Validate and Persist the Answers**
Use `validate` method to make sure that all the answers are validated.

Once the form is clean, use `getValidatedAnswers` method to get all answers from the form.

You can then store the answers to database or send it to backend via API.

### **Example (Frontend)**
```javascript
const valid = form.validate();

if (!valid) {
  alert('There are some invalid answers.');
  return;
}

await ... // Call API to send the answers to backend
```

If you are sending the answers from frontend to backend, backend can construct the form using the same configs, import the answers, and call `validate` method again to revalidate the answers from frontend before you save them into database.

### **Example (Backend API)**
```javascript
const answers = req.body;
form.importAnswers(answers);
const valid = form.validate();

if (!valid) {
  res.status(400);
  res.json({ error: 'There are some invalid answers.' });
  res.end();
  return;
}

await ... // Save the answers to database

res.status(200);
res.end();
```

<br />

# **Importing Answers**
Use `importAnswers` method to import answers to the entire form.

### **Example (Frontend)**
```javascript
const answers = await ... // retrieve from API
form.importAnswers(answers);
```

### **Example (Backend)**
```javascript
const answers = await ... // retrieve from database
form.importAnswers(answers);
```

<br />

# **Other Features**
Use the following methods to clear current answers:
- `clear`
- `clearGroup`
- `clearAnswer`

Use the following methods to reset answers to their default answers:
- `reset`
- `resetGroup`
- `resetAnswer`
