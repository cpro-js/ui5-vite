import { Plugin } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import ui5Vite from "./plugin";
import { Ui5ViteAppPluginOptions } from "./types.ts";

export default (options: Ui5ViteAppPluginOptions): Array<Plugin> => {
  return [
    ui5Vite(options),
    cssInjectedByJsPlugin({
      relativeCSSInjection: false,
      styleId: `${options.appId}-style`,
    }),
  ];
};
