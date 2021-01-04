/* eslint-disable no-template-curly-in-string */
import { RuleTester } from 'eslint';
import newline, {
  CONSIST_NEWLINE, MUST_NOT_SPLIT, MUST_SPLIT, MUST_SPLIT_TOO_LONG, NO_BLANK_BETWEEN,
} from '@/newline';

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

runner.run('no blank line between', newline, {
  valid: [],
  invalid: [
    {
      code: 'const { a, \n\nb, c } = foo;',
      errors: [
        { messageId: CONSIST_NEWLINE },
        { messageId: NO_BLANK_BETWEEN },
      ],
      output: 'const {\na,\nb,\nc\n} = foo;',
    },
  ],
});

runner.run('consist between', newline, {
  valid: [],
  invalid: [
    {
      code: 'const { a,\nb, c } = foo;',
      errors: [{ messageId: CONSIST_NEWLINE }],
      output: 'const {\na,\nb,\nc\n} = foo;',
    },
    {
      code: 'const { a,\nb, c } = foo;',
      options: [{ items: 3 }],
      errors: [{ messageId: MUST_NOT_SPLIT }],
      output: 'const {a,b,c} = foo;',
    },
  ],
});

runner.run('default options', newline, {
  invalid: [
    {
      code: 'const { a, b, c } = foo;',
      errors: [{ messageId: MUST_SPLIT }],
      output: 'const {\na,\nb,\nc\n} = foo;',
    },
    {
      code: 'const { a,...other } = foo;',
      errors: [{ messageId: MUST_SPLIT }],
      output: 'const {\na,\n...other\n} = foo;',
    },
    {
      code: 'const { a: aliasA,...other } = foo;',
      errors: [{ messageId: MUST_SPLIT }],
      output: 'const {\na: aliasA,\n...other\n} = foo;',
    },
    {
      code: 'const { a, \n\nb } = foo;',
      errors: [{ messageId: MUST_NOT_SPLIT }],
      output: 'const {a,b} = foo;',
    },
    {
      code: "const { 'foo': xx,\n'bar': yy } = foo;",
      errors: [{ messageId: MUST_NOT_SPLIT }],
      output: "const {'foo': xx,'bar': yy} = foo;",
    },
  ],
  valid: [
    // shorthand
    'const { a, b } = foo;',
    'const { a,\n...other } = foo;',
    // not shorthand
    'const { a: aliasA, b } = foo;',
    'const { a: aliasA,\n...other } = foo;',
    // with assignment
    'const { a = defaultA, b = `xx${xx}` } = foo;',
    'const { a = defaultA,\n...other } = foo;',
    // not shorthand, with assignment
    'const { a: aliasA = defaultA, b } = foo;',
    'const { a: aliasA = defaultA, b: aliasB = true, } = foo;',
    'const { a: aliasA = defaultA,\n...other } = foo;',
  ],
});

runner.run('option `items`', newline, {
  valid: [
    {
      code: 'const { a, b, c } = foo;',
      options: [{ items: 3 }],
    },
    {
      code: 'const { a, b } = foo;',
      options: [{ items: 2 }],
    },
  ],
  invalid: [
    {
      code: 'const { a, b, c, d } = foo;',
      options: [{ items: 3 }],
      errors: [{
        messageId: MUST_SPLIT,
        data: {
          [MUST_SPLIT]: 3,
        },
      }],
      output: 'const {\na,\nb,\nc,\nd\n} = foo;',
    },
  ],
});

runner.run('option `itemsWithRest`', newline, {
  valid: [
    {
      code: 'const { a, b, ...other } = foo;',
      options: [{ itemsWithRest: 3 }],
    },
    {
      code: 'const { a,\n...other } = foo;',
      options: [{ itemsWithRest: 1 }],
    },
  ],
  invalid: [
    {
      code: 'const { a, b, c, ...other } = foo;',
      options: [{ itemsWithRest: 3 }],
      errors: [{
        messageId: MUST_SPLIT,
        data: {
          [MUST_SPLIT]: 3,
        },
      }],
      output: 'const {\na,\nb,\nc,\n...other\n} = foo;',
    },
  ],
});

runner.run('option `maxLength`', newline, {
  valid: [
    {
      code: 'const { fooo, barrrrr } = foo;', // length: 30
      options: [{ maxLength: 30 }],
    },
    {
      code: 'const { fooo,\nbarrrrr } = foo;', // length: 30
      options: [{ maxLength: 29 }],
    },
  ],
  invalid: [
    {
      code: 'const { fooo, barrrrr } = foo;',
      options: [{ maxLength: 29 }],
      errors: [{
        messageId: MUST_SPLIT_TOO_LONG,
        data: {
          [MUST_SPLIT_TOO_LONG]: 29,
        },
      }],
      output: 'const {\nfooo,\nbarrrrr\n} = foo;',
    },
  ],
});

runner.run('option `maxLength` with others', newline, {
  valid: [
    {
      code: 'const { fooo,\nbarrrrr } = foo;', // length: 30
      options: [{
        maxLength: 29,
        items: 3,
      }],
    },
  ],
  invalid: [
    {
      code: 'const { fooo, barrrrr } = foo;', // length: 30
      options: [{
        maxLength: 30,
        items: 1,
      }],
      errors: [{
        messageId: MUST_SPLIT,
        data: {
          [MUST_SPLIT]: 1,
        },
      }],
      output: 'const {\nfooo,\nbarrrrr\n} = foo;',
    },
  ],
});
