import js from "@eslint/js";
import globals from "globals";
import reactHooks from "eslint-plugin-react-hooks";
import reactRefresh from "eslint-plugin-react-refresh";
import tseslint from "typescript-eslint";

export default tseslint.config(
  { ignores: ["dist"] },
  {
    extends: [js.configs.recommended, ...tseslint.configs.recommended],
    files: ["**/*.{ts,tsx}"],
    languageOptions: {
      ecmaVersion: 2020,
      globals: globals.browser,
    },
    plugins: {
      "react-hooks": reactHooks,
      "react-refresh": reactRefresh,
    },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "react-refresh/only-export-components": ["warn", { allowConstantExport: true }],
      "@typescript-eslint/no-unused-vars": "off",
      
      // =============================================================================
      // Enum Enforcement Rules
      // =============================================================================
      
      // Disallow 'any' type - use explicit interfaces
      "@typescript-eslint/no-explicit-any": "error",
      
      // Require explicit return types on functions
      "@typescript-eslint/explicit-function-return-type": ["warn", {
        allowExpressions: true,
        allowTypedFunctionExpressions: true,
        allowHigherOrderFunctions: true,
        allowDirectConstAssertionInArrowFunctions: true,
      }],
      
      // Prefer const over let when variable is never reassigned
      "prefer-const": "error",
      
      // Disallow var - use const/let
      "no-var": "error",
      
      // Enforce consistent type imports
      "@typescript-eslint/consistent-type-imports": ["warn", {
        prefer: "type-imports",
        disallowTypeAnnotations: false,
      }],
      
      // Require switch statements to be exhaustive with union types
      "@typescript-eslint/switch-exhaustiveness-check": "warn",
      
      // Prefer nullish coalescing over logical OR for null/undefined
      "@typescript-eslint/prefer-nullish-coalescing": "off",
      
      // Prefer optional chaining
      "@typescript-eslint/prefer-optional-chain": "warn",
      
      // No non-null assertions (use proper null checks)
      "@typescript-eslint/no-non-null-assertion": "warn",
    },
  },
);
