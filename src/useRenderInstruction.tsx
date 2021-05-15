// eslint-disable-next-line import/no-unresolved
import { useEffect, useState } from 'react';
import { eventEmitter } from './EventEmitter';
import { FormEngine } from './FormEngine';
import { RenderInstruction } from './RenderInstructions';

export const useRenderInstruction = (form: FormEngine): [RenderInstruction, () => void] => {
  const [renderInstruction, setRenderInstruction] = useState<RenderInstruction>(form.getRenderInstruction());

  useEffect(() => {
    eventEmitter.addListener(form['getFormId'](), refreshRenderInstruction);
    return () => {
      eventEmitter.removeListener(form['getFormId'](), refreshRenderInstruction);
    };
  }, []);

  const refreshRenderInstruction = () => {
    setRenderInstruction(form.getRenderInstruction());
  };

  return [renderInstruction, refreshRenderInstruction];
};
