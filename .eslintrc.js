module.exports = {
  root: true,
  parser: '@typescript-eslint/parser',
  plugins: ['@typescript-eslint'],
  extends: ["eslint:recommended", "plugin:@typescript-eslint/eslint-recommended", "plugin:@typescript-eslint/recommended", "plugin:storybook/recommended"],
  rules: {
    "@typescript-eslint/no-empty-interface": "off",
    "@typescript-eslint/no-inferrable-types": "off",
    "@typescript-eslint/interface-name-prefix": [0],
    // "no-unused-vars": "off",
    "semi": "off",
    "indent": "off",
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
    "@typescript-eslint/no-use-before-define": "off",
    "no-extra-boolean-cast": "off"
  }
};