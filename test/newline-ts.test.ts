import { RuleTester } from 'eslint';
import newline, { MUST_SPLIT } from '@/newline';

const runner = new RuleTester({
  parser: require.resolve('@typescript-eslint/parser'),
  parserOptions: {
    project: 'tsconfig.json',
    createDefaultProgram: true,
    ecmaFeatures: {
      jsx: true,
    },
  },
});

runner.run('', newline, {
  valid: [
  ],
  invalid: [
    {
      code: 'const Foo = ({ prop1, prop2, prop3 }: Props) => {};',
      errors: [{ messageId: MUST_SPLIT }],
      output: 'const Foo = ({\nprop1,\nprop2,\nprop3\n}: Props) => {};',
    },
  ],
});
