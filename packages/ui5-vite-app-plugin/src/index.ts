import { Plugin } from "vite";
import Ui5ViteAppPlugin, { Ui5ViteAppPluginOptions } from "./Ui5ViteAppPlugin.ts";

export default (options: Ui5ViteAppPluginOptions): Plugin => {
  return new Ui5ViteAppPlugin(options);
};

export type { Ui5ViteAppPluginOptions };
