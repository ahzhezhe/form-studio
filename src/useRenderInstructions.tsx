// eslint-disable-next-line import/no-unresolved
import { useEffect, useState } from 'react';
import { eventEmitter } from './EventEmitter';
import { FormEngine } from './FormEngine';
import { RenderInstructions } from './RenderInstructions';

export const useRenderInstructions = (form: FormEngine): [RenderInstructions, () => void] => {
  const [renderInstructions, setRenderInstructions] = useState<RenderInstructions>(form.getRenderInstructions());

  useEffect(() => {
    eventEmitter.addListener(form['getFormId'](), refreshRenderInstructions);
    return () => {
      eventEmitter.removeListener(form['getFormId'](), refreshRenderInstructions);
    };
  }, []);

  const refreshRenderInstructions = () => {
    setRenderInstructions(form.getRenderInstructions());
  };

  return [renderInstructions, refreshRenderInstructions];
};
