import fs from "fs";
import path from "path";
import { EmittedAsset } from "rollup";
import { ConfigEnv, normalizePath, ResolvedConfig, UserConfig } from "vite";
import { Ui5ViteAppPluginOptions } from "../index.ts";
import { transformCode } from "../transform/babel.ts";

const virtualModuleId = "virtual:@cpro-js/ui5-vite-app-plugin/runtime";
const resolvedVirtualModuleId = "\0" + virtualModuleId;

export class BasePlugin {
  constructor(
    protected viteConfig: UserConfig | ResolvedConfig,
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
          const { ui5RuntimeGlobalVariable } = this;
          if (hostType === "js") {
            return {
              runtime: `window["${ui5RuntimeGlobalVariable}"].publicAssetsURL(${JSON.stringify(filename)})`,
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

  public configResolved(config: ResolvedConfig) {
    this.viteConfig = config;
  }

  public resolveId = (id: string) => {
    if (id === virtualModuleId) {
      return resolvedVirtualModuleId;
    }
  };

  public load = (id: string) => {
    if (id === resolvedVirtualModuleId) {
      const { basePath, ui5AppId, ui5NamespacePath, ui5RuntimeGlobalVariable } = this;

      return transformCode(
        "runtime.js",
        `
          let startCb = function () {
            throw new Error("No App registered!");
          };
          export const register = function (cb) {
            startCb = cb;
          };

          export const render = function (...args) {
            return startCb(...args);
          };

          window["${ui5RuntimeGlobalVariable}"] = {
            start: function(...args) {
              return startCb(...args);
            },
            publicAssetsURL: function(filename) {
              const adjustedPath = typeof sap == 'undefined' ? "${basePath}" + filename : sap.ui.require.toUrl("${ui5NamespacePath}/" + filename);
              const cacheBustedFilename = typeof sap === 'undefined' || typeof sap.ui.core.AppCacheBuster === 'undefined' ? adjustedPath : sap.ui.core.AppCacheBuster.convertURL(adjustedPath);
              return cacheBustedFilename;
            }
          };
        `,
      ).trim();
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

    const componentTs = path.resolve(projectDir, "./ui5/Component.ts");
    const manifestJson = path.resolve(projectDir, "./ui5/manifest.json");
    const indexUiHtml = path.resolve(projectDir, "./ui5/index-ui5.html");

    const { ui5NamespacePath, ui5RuntimeGlobalVariable } = this;

    const appFiles: Array<EmittedAsset & { id: string }> = [
      {
        id: normalizePath(componentTs),
        name: "Component.js",
        fileName: "Component.js",
        type: "asset",
        source: transformCode("Component.ts", fs.readFileSync(componentTs).toString(), {
          removeImport: virtualModuleId,
          transformUi5: true,
          codeToInject: `
            const render = function(...args) {
              window["${ui5RuntimeGlobalVariable}"].start(...args);
            };
          `,
        }).replace(options?.entryFilename ?? "", options?.outputFilename ?? ""),
      },
      {
        id: normalizePath(manifestJson),
        name: "manifest.json",
        fileName: "manifest.json",
        type: "asset",
        source: fs.readFileSync(manifestJson),
      },
    ];

    return [
      ...appFiles,
      {
        name: "Component-preload.js",
        fileName: "Component-preload.js",
        id: normalizePath(componentTs.replace(".ts", ".js")),
        type: "asset",
        source: `sap.ui.require.preload(${JSON.stringify(
          appFiles.reduce<{
            [file: string]: string;
          }>((map, file) => {
            map[`${ui5NamespacePath}/${file.name}`] = file.source!.toString();
            return map;
          }, {}),
          null,
          "\t",
        )}, "${ui5NamespacePath}/Component-preload");`,
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

  /**
   * Returns the used base path in vite.config.ts
   * Note: This will only be used in non-UI5 environments
   *
   * @protected
   */
  protected get basePath(): string {
    return this.addTrailingSlash(this.viteConfig.base ?? "/");
  }

  /**
   * Returns the Application Id used by UI5
   * Example: ui5.react.example
   * @protected
   */
  protected get ui5AppId(): string {
    return this.pluginOptions.appId;
  }

  /**
   * Returns the used UI5 namespace as path (UI5 App Id transformed to path)
   * Example: ui5/react/example
   * @protected
   */
  protected get ui5NamespacePath(): string {
    return this.ui5AppId.replace(/\./g, "/");
  }

  /**
   * Returns the used global variable name to register UI5/vite runtime code
   * @protected
   */
  protected get ui5RuntimeGlobalVariable(): string {
    return `UI5_RUNNER@${this.ui5AppId}`;
  }

  private addTrailingSlash(path: string) {
    return path.replace(/\/?$/, "/");
  }
}
