import { Rule } from 'eslint';
// eslint-disable-next-line import/no-unresolved
import { SourceLocation } from 'estree';

interface Option {
  items?: number;
  itemsWithRest?: number;
  maxLength?: number;
}

type ElementOf<T> = T extends Array<infer U> ? U : never;
type NullableLocation = SourceLocation | null | undefined;
type Node = Parameters<NonNullable<Rule.NodeListener['ObjectPattern']>>[0];
type Item = ElementOf<Node['properties']>;

const MAX_COUNT = 2;
const MAX_REST_COUNT = 1;
const MAX_LENGTH = Infinity;

export const MUST_SPLIT = 'mustSplit';
export const MUST_NOT_SPLIT = 'mustNotSplit';
export const MUST_SPLIT_TOO_LONG = 'mustSplitTooLong';
export const NO_BLANK_BETWEEN = 'noBlankBetween';
export const CONSIST_NEWLINE = 'consistNewline';

function getPropertyString(
  context: Rule.RuleContext,
  item: Item,
  multiLine: boolean,
  isLast = false,
) {
  const originalText = context.getSourceCode().getText(item);

  if (item.type === 'RestElement') {
    if (item.argument.type === 'Identifier') {
      return `...${item.argument.name}`;
    }

    return originalText;
  }

  const { value, key } = item;
  let endString = ',';

  if (isLast) {
    endString = '';
  } else if (multiLine) {
    endString += '\n';
  }

  if (
    key.type !== 'Identifier'
    || (value.type !== 'Identifier' && value.type !== 'AssignmentPattern')
  ) {
    return originalText;
  }

  if (item.shorthand) {
    return key.name + endString;
  }

  if (value.type === 'Identifier') {
    return `${key.name}: ${value.name}${endString}`;
  }

  if (
    value.left.type !== 'Identifier'
    || (
      value.right.type !== 'Literal'
      && value.right.type !== 'TemplateLiteral'
      && value.right.type !== 'Identifier'
    )
  ) {
    return originalText;
  }

  let valueString = value.left.name;

  valueString += ' = ';

  if (value.right.type === 'Identifier') {
    valueString += value.right.name;
  } else if (value.right.type === 'Literal') {
    valueString += value.right.raw ?? '';
  } else {
    valueString += context.getSourceCode().getText(value.right);
  }

  return `${key.name}: ${valueString}${endString}`;
}

function getFixer(context: Rule.RuleContext, node: Node, multiLine = true) {
  return (fixer: Rule.RuleFixer) => {
    const { properties } = node;
    const lastIndex = properties.length - 1;
    const newValues = node.properties.map(
      (item, i) => getPropertyString(context, item, multiLine, i === lastIndex),
    );
    let newString = newValues.join('');

    if (multiLine) {
      newString = `\n${newString}\n`;
    }

    return fixer.replaceText(node, `{${newString}}`);
  };
}

const rule: Rule.RuleModule = {
  meta: {
    type: 'layout',
    fixable: 'whitespace',
    schema: {
      type: 'array',
      minItems: 0,
      maxItems: 1,
      items: {
        type: 'object',
        properties: {
          items: {
            type: 'number',
            minimum: 1,
          },
          itemsWithRest: {
            type: 'number',
            minimum: 1,
          },
          maxLength: {
            type: 'number',
            minimum: 4, // `{}=x`, x stands for a variable
          },
        },
      },
    },
    messages: {
      [MUST_SPLIT]: `Object desctructuring lines must be broken into multiple lines if there are more than {{${MUST_SPLIT}}} properties`,
      [MUST_SPLIT_TOO_LONG]: `Object desctructuring lines must be broken into multiple lines if the line is longer than {${MUST_SPLIT_TOO_LONG}}`,
      [MUST_NOT_SPLIT]: `Object desctructuring lines must not be broken into multiple lines if there are {{${MUST_NOT_SPLIT}}} or less elements.`,
      [NO_BLANK_BETWEEN]: 'Object desctructuring lines cannot have blank line between them.',
      [CONSIST_NEWLINE]: 'Object desctructuring lines must be put on newlines',
    },
  },
  create(ctx) {
    const {
      items = MAX_COUNT,
      itemsWithRest = MAX_REST_COUNT,
      maxLength = MAX_LENGTH,
    } = (ctx.options[0] ?? {}) as Option;

    return {
      ObjectPattern(node) {
        const { properties } = node;

        if (properties.length <= 1) {
          return;
        }

        let currenLoc: NullableLocation;
        let nextLoc: NullableLocation;
        let hasRest = false;
        let multiLine = false;
        let inSameLine = false;
        let hasBlankBetween = false;

        for (let i = 0; i < properties.length - 1; i++) {
          hasRest ||= properties[i].type === 'RestElement';
          currenLoc = properties[i].loc;
          nextLoc = properties[i + 1].loc;

          if (!currenLoc || !nextLoc) {
            continue;
          }

          if (nextLoc.start.line !== currenLoc.start.line) {
            multiLine = true;
          } else {
            inSameLine = true;
          }

          if (currenLoc.end.line + 1 < nextLoc.start.line) {
            hasBlankBetween = true;

            continue;
          }

          if (i === properties.length - 2) {
            hasRest ||= properties[i + 1].type === 'RestElement';
            multiLine ||= nextLoc.end.line !== nextLoc.start.line;
          }
        }

        const maxCount = hasRest ? itemsWithRest : items;
        const start = node.loc?.start.line ?? NaN;
        const end = node.loc?.end.line ?? NaN;
        const lines = ctx.getSourceCode().getLines().slice(start - 1, end);
        const textLength = lines.map(line => line.trimEnd()).join('').length;

        // loc is null/undefined
        if (Number.isNaN(start) && Number.isNaN(end)) {
          return;
        }

        // line break is not included in lines
        const isLongText = (textLength + end - start) > maxLength;
        const hasManyItems = properties.length > maxCount;

        // conditions that need wrap text
        if (hasManyItems || isLongText) {
          if (!multiLine) {
            ctx.report({
              node,
              messageId: hasManyItems ? MUST_SPLIT : MUST_SPLIT_TOO_LONG,
              data: hasManyItems
                ? {
                  [MUST_SPLIT]: maxCount.toString(),
                }
                : {
                  [MUST_SPLIT_TOO_LONG]: maxLength.toString(),
                },
              fix: getFixer(ctx, node),
            });

            return;
          }

          if (inSameLine) {
            ctx.report({
              node,
              messageId: CONSIST_NEWLINE,
              fix: getFixer(ctx, node),
            });
          }

          if (hasBlankBetween) {
            ctx.report({
              node,
              messageId: NO_BLANK_BETWEEN,
              fix: getFixer(ctx, node),
            });
          }
        } else if (multiLine) {
          ctx.report({
            node,
            messageId: MUST_NOT_SPLIT,
            data: {
              [MUST_NOT_SPLIT]: maxCount.toString(),
            },
            fix: getFixer(ctx, node, false),
          });
        }
      },
    };
  },
};

export default rule;
