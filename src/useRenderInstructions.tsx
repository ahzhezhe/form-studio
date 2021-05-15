// eslint-disable-next-line import/no-unresolved
import { useEffect, useState } from 'react';
import { eventEmitter } from './EventEmitter';
import { Form } from './Form';
import { RenderInstructions } from './RenderInstructions';

/**
 * React hook to use render instructions from a given form.
 *
 * @param form form
 * @returns render instructions and function to refresh render instructions manually
 */
export const useRenderInstructions = (form: Form): [RenderInstructions, () => void] => {
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
