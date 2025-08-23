/** @import { Config } from "prettier" */

// @todo Eventually use prettier.config.ts, see https://github.com/prettier/prettier-vscode/issues/3623
/** @type {Config} */
const config = {
  singleQuote: true,
  singleAttributePerLine: true,
  plugins: ['prettier-plugin-organize-imports'],
};

export default config;
