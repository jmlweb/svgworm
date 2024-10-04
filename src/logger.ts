import chalk from 'chalk';

const logger = {
  success: (message: string) => console.log(chalk.green(message)),
  error: (message: string) => console.error(chalk.red(message)),
  info: (message: string) => console.log(chalk.blue(message)),
};

export default logger;
