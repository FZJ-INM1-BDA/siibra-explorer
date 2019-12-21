module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: [
    '@typescript-eslint',
  ],
  extends: [
    'eslint:recommended',
    'plugin:@typescript-eslint/eslint-recommended',
    'plugin:@typescript-eslint/recommended',
  ],
  rules: {
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/interface-name-prefix":[0],
    // "no-unused-vars": "off",
    // "@typescript-eslint/no-unused-var": [2],
    "semi": "off",
    // "indent":["error", 2, {
    //   "FunctionDeclaration":{
    //     "body":1,
    //     "parameters":2
    //   }
    // }],
    "@typescript-eslint/member-delimiter-style": [2, {
      "multiline": {
          "delimiter": "none",
          "requireLast": true
      },
      "singleline": {
          "delimiter": "comma",
          "requireLast": false
      }
    }],
    "@typescript-eslint/no-unused-vars": ["warn", {
      "argsIgnorePattern": "^_"
    }],
    "@typescript-eslint/explicit-function-return-type": "off",
    "@typescript-eslint/no-explicit-any": "off",
    "@typescript-eslint/no-use-before-define": "off"
  }
};