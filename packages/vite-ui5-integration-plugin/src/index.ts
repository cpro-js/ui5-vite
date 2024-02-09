import { Plugin } from "vite";
import cssInjectedByJsPlugin from "vite-plugin-css-injected-by-js";
import ui5Vite from "./plugin";
import { ViteUI5IntegrationPluginOptions } from "./types.ts";

export default (options: ViteUI5IntegrationPluginOptions): Array<Plugin> => {
  return [
    ui5Vite(options),
    cssInjectedByJsPlugin({
      relativeCSSInjection: true,
      styleId: options.appId,
      // note: injectCodeFunction needs to serializable
      injectCodeFunction: function (cssCode, options) {
        try {
          if (typeof document != "undefined") {
            const elementStyle = document.createElement("style");
            elementStyle.setAttribute("data-app", options.styleId as string);
            elementStyle.appendChild(document.createTextNode(cssCode));
            document.head.appendChild(elementStyle);
          }
        } catch (e) {
          console.error("vite-plugin-css-injected-by-js", e);
        }
      },
    }),
  ];
};
