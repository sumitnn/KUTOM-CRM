import importPlugin from 'eslint-plugin-import'

export default [
  { ignores: ['dist', 'node_modules'] },

  {
    files: ['**/*.{js,jsx}'],

    languageOptions: {
      ecmaVersion: 'latest',
      sourceType: 'module',
      parserOptions: {
        ecmaFeatures: {
          jsx: true, // ✅ THIS FIXES "Unexpected token <"
        },
      },
    },

    plugins: {
      import: importPlugin,
    },

    settings: {
      'import/resolver': {
        alias: {
          map: [['@', './src']],
          extensions: ['.js', '.jsx'],
        },
      },
    },

    rules: {
      // ✅ ONLY RULE THAT MATTERS (Linux-safe paths)
      'import/no-unresolved': ['error', { caseSensitive: true }],

      // ❌ TURN OFF ALL NOISE
      'no-unused-vars': 'off',
      'react/prop-types': 'off',
      'react/react-in-jsx-scope': 'off',
      'react/jsx-uses-vars': 'off',
      'react/no-unescaped-entities': 'off',
      'react-refresh/only-export-components': 'off',
    },
  },
]
