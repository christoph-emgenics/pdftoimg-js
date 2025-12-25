export type LimiterTask<T> = () => Promise<T>;

export function createLimiter(maxConcurrency: number) {
  const limit = Math.max(1, Math.floor(maxConcurrency));
  let activeCount = 0;
  const queue: Array<() => void> = [];

  const next = () => {
    if (activeCount >= limit || queue.length === 0) {
      return;
    }
    activeCount += 1;
    const run = queue.shift();
    if (run) {
      run();
    }
  };

  return function runLimited<T>(task: LimiterTask<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      const execute = () => {
        task()
          .then(resolve, reject)
          .finally(() => {
            activeCount -= 1;
            next();
          });
      };

      queue.push(execute);
      next();
    });
  };
}
