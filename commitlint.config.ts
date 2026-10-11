import commitlintConfig from '@jmlweb/commitlint-config';

export default {
  ...commitlintConfig,
  rules: {
    ...commitlintConfig.rules,
    // Subjects cite task and ADR ids (TSK-010, ADR-0008), which are upper-case by definition.
    'subject-case': [0],
  },
};
