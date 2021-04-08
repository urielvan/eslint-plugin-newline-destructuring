# eslint-plugin-newline-destructuring

Eslint plugin for enforcing newlines in object destructuring assignment past a certain number of properties.

## Usage

Add `newline-destructuring` to the plugins section of your eslint configuration file.

``` js
plugins: [
  'newline-destructuring'
]
```

Then add the rule in the rules section

``` js
rules: {
  'newline-destructuring/newline': 'error'
}
```

### Options

The rule accepts an option object with the following properties:

- `items` [number] (default: `3`) - Specifies the maximum number of properties before the plugin requires breaking up the statement to multiple lines.

- `itemsWithRest` [number] (default: `2`) - Specifies the maximum number of properties **contain rest pattern** before the plugin requires breaking up the statement to multiple lines.

- `maxLength` [number] (default: `Infinity`) - Specifies the maximum length for source code lines in your project, the plugin will split long destructuring lines even if they contains properties less than value in `items` or `itemsWithRest`
