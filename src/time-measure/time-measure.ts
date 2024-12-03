import { PrettyError } from '../errors';

const timeMeasure = (() => {
  let startTime: number;
  return {
    start: () => {
      startTime = performance.now();
    },
    get: () => {
      if (startTime === undefined) {
        throw new PrettyError('Time measure not started');
      }
      return (performance.now() - startTime).toFixed(3);
    },
  };
})();

export default timeMeasure;
