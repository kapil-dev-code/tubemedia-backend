import globals from "globals";
import pluginJs from "@eslint/js";

/** @type {import('eslint').Linter.Config} */
export default {
  languageOptions: {
    globals: {
      ...globals.browser, 
      ...globals.node, 
    },
  },
 
  extends: [
    "eslint:recommended",
    pluginJs.configs.recommended,
    "plugin:prettier/recommended",
  ],
  plugins: ["prettier"], 
  rules: {
    "prettier/prettier": "error", 
    "no-console": "warn",
    "eqeqeq": "error",
    "no-var":"error",
    "no-unused-vars": ["warn", {   
      "vars": "all",                
      "args": "after-used",       
      "ignoreRestSiblings": false, 
    }],
  },
};
