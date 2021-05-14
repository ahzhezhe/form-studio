import { useEffect, useState } from 'react';
import { eventEmitter } from './EventEmitter';
import { FormEngine } from './FormEngine';
import { Template } from './Templates';

export const useTemplate = (form: FormEngine): [Template, () => void] => {
  const [template, setTemplate] = useState<Template>(form.toTemplate());

  useEffect(() => {
    eventEmitter.addListener(form.getTemplateId(), refreshTemplate);
    return () => {
      eventEmitter.removeListener(form.getTemplateId(), refreshTemplate);
    };
  }, []);

  const refreshTemplate = () => {
    setTemplate(form.toTemplate());
  };

  return [template, refreshTemplate];
};
