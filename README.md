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

- `items` [number] (default: `2`) - Specifies the maximum number of properties before the plugin requires breaking up the statement to multiple lines. If there are exactly this many or fewer properties, then the plugin will make sure the statement stays on one line unless it would violate the `maxLength` option or `consistent` option is used. More properties than this number will always be split onto multiple lines.

- `itemsWithRest` [number] (default: `1`) - Specifies the maximum number of properties **contain rest pattern** before the plugin requires breaking up the statement to multiple lines. If there are exactly this many or fewer properties, then the plugin will make sure the statement stays on one line unless it would violate the `maxLength` option or `consistent` option is used. More properties than this number will always be split onto multiple lines.

- `maxLength` [number] (default: `Infinity`) - Specifies the maximum length for source code lines in your project, the plugin will split long destructuring lines even if they contains properties less than value in `items` or `itemsWithRest`

- `consistent` [boolean] (default: false) - If there are less than the threshold items, allow new lines consistent with whether the curly braces are on their own lines or not.

- `allowAllPropertiesOnSameLine` [boolean] (default: false) - If there are less than the threshold items, allow all properties to be on the same line. But one like

  ``` js
  const {
    a,b,
    c
  } = obj
  ```
  will be split into multiple lines
