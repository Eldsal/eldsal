module.exports = {
  env: {
    browser: true,
    es6: true,
    jest: true
  },
  extends: [
    'airbnb',
  ],
  globals: {
    Atomics: 'readonly',
    SharedArrayBuffer: 'readonly',
  },
  parserOptions: {
    ecmaFeatures: {
      jsx: true,
    },
    ecmaVersion: 2018,
    sourceType: 'module',
  },
  plugins: [
    'react',
    'react-hooks'
  ],
  settings: {
    "import/resolver": {
      node: {
        extensions: [".js", ".jsx", ".json", ".native.js"]
      }
    }
  },
  rules: {
    "max-len" : 0,
    "semi": ["error", "always"],
    "quotes": ["error", "double"],
    "react/jsx-filename-extension": [1, { "extensions": [".js", ".jsx"] }],
    "comma-dangle": ["error", "never"],
    "react/forbid-prop-types": 0,
    "react/jsx-props-no-spreading": 0,
    "react/jsx-one-expression-per-line": 0,
    "react/prop-types": 0,
    "no-multiple-empty-lines": 0,
    "indent": ["error", 2]
  },
};
