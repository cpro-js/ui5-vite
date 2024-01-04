import * as fs from "fs";
import * as path from "path";
import type { Plugin, PluginOption, ResolvedConfig, UserConfig } from "vite";

export interface UI5RegisterAppPlugin {
  appId: string;
}

export default function ui5RegisterAppPlugin(options: UI5RegisterAppPlugin): PluginOption {
  const virtualModuleId = "virtual:ui5-register-app";
  const resolvedVirtualModuleId = "\0" + virtualModuleId;

  const appId = options.appId;
  const appPath = appId.replace(/\./g, "/");
  let config: ResolvedConfig;

  const emitUI5Files = (
    context: any,
    options: {
      /**
       * Original filename, e.g. main.tsx
       */
      entryFilename: string;
      /**
       * Processed filename, e.g. main.[1156].js
       */
      outputFilename: string;
    },
  ) => {
    context.emitFile({
      name: "Component.js",
      fileName: "Component.js",
      type: "asset",
      source: fs
        .readFileSync(path.resolve(__dirname, "../../ui5/Component.js"))
        .toString()
        .replace(options.entryFilename, options.outputFilename),
    });
    context.emitFile({
      name: "manifest.json",
      fileName: "manifest.json",
      type: "asset",
      source: fs.readFileSync(path.resolve(__dirname, "../../ui5/manifest.json")),
    });

    context.emitFile({
      name: "index-ui5.html",
      fileName: "index-ui5.html",
      type: "asset",
      source: fs.readFileSync(path.resolve(__dirname, "../../ui5/index-ui5.html")),
    });
  };

  return {
    name: "ui5-register-app",
    config() {
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
    },
    configResolved(resolvedConfig) {
      // store the resolved config
      config = resolvedConfig;
    },
    resolveId(id) {
      if (id === virtualModuleId) {
        return resolvedVirtualModuleId;
      }
    },

    load(id) {
      if (id === resolvedVirtualModuleId) {
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

          window["UI5_RUNNER@${appId}"] = {
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
    },

    async buildStart(options) {
      // only for dev
      console.log("buildend");
      if (config.command === "serve") {
        const entryFile = (Array.isArray(options.input) ? options.input : [])
          .filter((file) => [".tsx", ".ts", ".js"].includes(path.extname(file)))
          .pop();

        if (!entryFile) {
          this.error("Entry file not found!");
        }
        // not working for dev --> server middleware!
        const entryFileServerPath = entryFile.replace(config.root, "");
        emitUI5Files(this, {
          entryFilename: entryFileServerPath,
          outputFilename: entryFileServerPath,
        });
      }
    },
    generateBundle(options, bundle, isWrite) {
      // only for build
      if (config.command === "build") {
        const ui5Entry = Array.from(this.getModuleIds())
          .map((file) => this.getModuleInfo(file))
          .filter((mod) => mod.isEntry)
          .filter((mod) => [".tsx", ".ts", ".js"].includes(path.extname(mod.id)))
          .pop();

        if (!ui5Entry) {
          this.error("UI5 Entry file not found!");
        }

        const ui5EntryOuput = Object.values(bundle).find(
          (output) => output.type === "chunk" && output.facadeModuleId === ui5Entry.id,
        );

        if (!ui5EntryOuput || ui5EntryOuput.type !== "chunk") {
          this.error("Output file not found!");
        }

        const cssFiles = ui5EntryOuput.viteMetadata!.importedAssets;

        const entryFileServerPath = ui5Entry.id.replace(config.root, "");
        const outputFileServerPath = ui5EntryOuput.fileName;

        emitUI5Files(this, {
          entryFilename: entryFileServerPath,
          outputFilename: outputFileServerPath,
        });
      }
    },
  };
}
