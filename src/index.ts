/* eslint-disable import/no-default-export */
import { GroupConfig, QuestionConfig, ChoiceConfig, Config } from './Configs';
import { FormEngine } from './FormEngine';
import { GroupInitConfig, QuestionInitConfig, ChoiceInitConfig, InitConfig } from './InitConfigs';
import { GroupTemplate, QuestionTemplate, ChoiceTemplate, Template } from './Templates';
import { ConfigType, QuestionType, Validator, Answers } from './Types';
import { useTemplate } from './useTemplate';

export default FormEngine;

export {
  GroupConfig, QuestionConfig, ChoiceConfig, Config,
  GroupInitConfig, QuestionInitConfig, ChoiceInitConfig, InitConfig,
  GroupTemplate, QuestionTemplate, ChoiceTemplate, Template,
  ConfigType, QuestionType, Validator, Answers,
  useTemplate
};
