import { findUp } from 'find-up';

export const findPackageJSON = () =>
  findUp('package.json').catch(() => undefined);
