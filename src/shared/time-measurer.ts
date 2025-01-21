import colors from 'picocolors';

export const timeMeasurer = (() => {
  const spans: Record<string, number> = {};

  const increment = (label: string, amount: number) => {
    if (!spans[label]) {
      spans[label] = 0;
    }

    spans[label] += amount;
  };

  const start = (label: string) => {
    const startTime = performance.now();

    return () => {
      const individualAmount = performance.now() - startTime;
      increment(label, individualAmount);
      return individualAmount.toFixed(3);
    };
  };

  const print = () => {
    let result = colors.bold(colors.underline('Performance:\n'));
    let total = 0;

    const [main, partials] = Object.entries(spans)
      .sort()
      .reduce(
        (acc, curr) => {
          if (curr[0].startsWith('main')) {
            acc[0].push(curr);
          } else {
            acc[1].push(curr);
          }

          return acc;
        },
        [[], []] as [[string, number][], [string, number][]],
      );

    result += `${colors.bold('Main')}\n`;
    for (const [label, amount] of main) {
      total += amount;
      result += `${label}: ${amount.toFixed(3)}ms\n`;
    }

    result += `${colors.bold('Partials\n')}`;
    for (const [label, amount] of partials) {
      result += `${label}: ${amount.toFixed(3)}ms\n`;
    }

    result += `${colors.bold('Total')}: ${total.toFixed(3)}ms\n`;

    return result;
  };

  return {
    start,
    print,
  };
})();
