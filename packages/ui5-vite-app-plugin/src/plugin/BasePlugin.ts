import fs from "fs";
import path from "path";
import { EmittedAsset } from "rollup";
import { ConfigEnv, normalizePath, UserConfig } from "vite";
import { Ui5ViteAppPluginOptions } from "../index.ts";

const virtualModuleId = "virtual:@cpro-js/ui5-vite-app-plugin/runtime";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export class BasePlugin {
  constructor(
    protected viteConfig: UserConfig,
    protected viteEnv: ConfigEnv,
    protected pluginOptions: Ui5ViteAppPluginOptions,
  ) {}

  public config = () => {
    const config: Partial<UserConfig> = {
      build: {
        cssCodeSplit: true,
      },
      experimental: {
        renderBuiltUrl: (filename, { hostType }) => {
          if (hostType === "js") {
            return {
              runtime: `window.__vitePublicAssetsURL(${JSON.stringify(filename)})`,
            };
          } else {
            // In HTML and CSS we only use relative paths until we craft a clever runtime CSS hack
            return { relative: true };
          }
        },
      },
    };
    return config;
  };

  public resolveId = (id: string) => {
    if (id === virtualModuleId) {
      return resolvedVirtualModuleId;
    }
  };

  public load = (id: string) => {
    if (id === resolvedVirtualModuleId) {
      const appId = this.pluginOptions.appId;
      const appPath = appId.replace(/\./g, "/");

      // TODO __vitePublicAssetsURL must be unique for each appid
      return `
          let startCb = function () {
            throw new Error("No App registered!");
          };
          export const register = function (cb) {
            startCb = cb;
          };

          export const render = function (options) {
            return startCb(options);
          };

          window["UI5_RUNNER@${this.pluginOptions.appId}"] = {
            start: function(options) {
              return startCb(options);
            },
          };

          // it is important to set public path for webpack's module loader
          const basePath = typeof sap === 'undefined' ? "/" : sap.ui.require.toUrl("${appPath}/Component.js").replace(/Component\.js$/, "");
          window.__vitePublicAssetsURL = function(filename) {
            console.log("__vitePublicAssetsURL", filename);
            return basePath + filename;
          };

          `.trim();
    }
  };

  protected getUi5Files(options?: {
    /**
     * Original filename, e.g. main.tsx
     */
    entryFilename?: string;
    /**
     * Processed filename, e.g. main.[1156].js
     */
    outputFilename?: string;
  }): Array<EmittedAsset & { id: string }> {
    // TODO UI5 template root directory
    const projectDir = path.resolve(this.viteConfig.root!, "..");

    const componentJs = path.resolve(projectDir, "./ui5/Component.js");
    const manifestJson = path.resolve(projectDir, "./ui5/manifest.json");
    const indexUiHtml = path.resolve(projectDir, "./ui5/index-ui5.html");

    return [
      {
        id: normalizePath(componentJs),
        name: "Component.js",
        fileName: "Component.js",
        type: "asset",
        source: fs
          .readFileSync(componentJs)
          .toString()
          .replace(options?.entryFilename ?? "", options?.outputFilename ?? ""),
      },
      {
        id: normalizePath(manifestJson),
        name: "manifest.json",
        fileName: "manifest.json",
        type: "asset",
        source: fs.readFileSync(manifestJson),
      },
      {
        id: normalizePath(indexUiHtml),
        name: "index-ui5.html",
        fileName: "index-ui5.html",
        type: "asset",
        source: fs.readFileSync(indexUiHtml),
      },
    ];
  }
}
