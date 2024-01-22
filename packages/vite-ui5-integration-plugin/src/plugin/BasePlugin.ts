import fs, { Dirent } from "fs";
import path from "path";
import { EmittedAsset, PluginContext, SourceDescription } from "rollup";
import { ConfigEnv, normalizePath, ResolvedConfig, UserConfig } from "vite";
import { transformCode } from "../transform/babel.ts";
import { Ui5ViteAppPluginOptions } from "../types.ts";

const virtualModuleId = "virtual:@cpro-js/vite-ui5-integration-plugin/runtime";
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
        rollupOptions: {
          output: {
            entryFileNames: (info) => {
              // prevent UI5 files from being hashed
              if (info.isEntry && info.facadeModuleId?.endsWith("Component.ts")) {
                return "[name].js";
              }
              // everything else is safe to transform
              return "[name]-[hash].js";
            },
          },
        },
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

  public configResolved = (config: ResolvedConfig) => {
    this.viteConfig = config;
  };

  public resolveId = async (context: PluginContext, id: string) => {
    if (id === virtualModuleId) {
      return resolvedVirtualModuleId;
    } else if (id.startsWith("sap/")) {
      return {
        id,
        external: true,
      };
    } else if (id === "/Component.ts") {
      return this.getUi5FileId("Component.ts");
    }
  };

  public load = (id: string) => {
    switch (true) {
      case id === resolvedVirtualModuleId: {
        const { basePath, ui5AppId, ui5NamespacePath, ui5RuntimeGlobalVariable } = this;

        return transformCode(
          "runtime.js",
          `
          let startCb = function () {
            throw new Error("No App registered!");
          };
          export const register = function (cb) {
            startCb = cb;

            if (window["${ui5RuntimeGlobalVariable}"].whenRegistered) {
              const registerFn = window["${ui5RuntimeGlobalVariable}"].whenRegistered();
              delete window["${ui5RuntimeGlobalVariable}"].whenRegistered;
            }
          };

          export const render = function (...args) {
            return startCb(...args);
          };

          if (!window["${ui5RuntimeGlobalVariable}"]) {
            window["${ui5RuntimeGlobalVariable}"] = {};
          }

          window["${ui5RuntimeGlobalVariable}"].start = function(...args) {
            return startCb(...args);
          };

          window["${ui5RuntimeGlobalVariable}"].publicAssetsURL = function(filename) {
              const adjustedPath = typeof sap == 'undefined' ? "${basePath}" + filename : sap.ui.require.toUrl("${ui5NamespacePath}/" + filename);
              const cacheBustedFilename = typeof sap === 'undefined' || typeof sap.ui.core.AppCacheBuster === 'undefined' ? adjustedPath : sap.ui.core.AppCacheBuster.convertURL(adjustedPath);
              return cacheBustedFilename;
          };
        `,
        ).code;
      }
    }
  };

  public transform(code: string, id: string): string | Partial<SourceDescription> | undefined {
    if (this.getUi5FileId("Component.ts") === id) {
      const { ui5RuntimeGlobalVariable } = this;

      return transformCode(id, code, {
        removeImport: virtualModuleId,
        transformUi5: true,
        codeToInject: `
            const render = function(...args) {
              if (!window["${ui5RuntimeGlobalVariable}"] || typeof window["${ui5RuntimeGlobalVariable}"].start === "undefined") {
                window["${ui5RuntimeGlobalVariable}"] = {};
                window["${ui5RuntimeGlobalVariable}"].whenRegistered = function() {
                  window["${ui5RuntimeGlobalVariable}"].start(...args);
                }
              } else {
                window["${ui5RuntimeGlobalVariable}"].start(...args);
              }
            };
          `,
      });
    }
  }

  protected async getAdditionalUi5Files(): Promise<Array<EmittedAsset & { id: string }>> {
    const projectDir = path.resolve(this.viteConfig.root!, "..");
    const ui5Dir = path.join(projectDir, "ui5");

    const manifestJson = path.resolve(ui5Dir, "./manifest.json");
    const htmlPaths = await this.getFilesInDir(ui5Dir, [".html"]);

    return [
      {
        id: normalizePath(manifestJson),
        name: "manifest.json",
        fileName: "manifest.json",
        type: "asset",
        source: fs.readFileSync(manifestJson).toString(),
      },
      ...htmlPaths.map<EmittedAsset & { id: string }>((p) => ({
        id: normalizePath(p),
        name: path.basename(p),
        fileName: path.basename(p),
        type: "asset",
        source: fs.readFileSync(p).toString(),
      })),
    ];
  }

  protected getUi5FileId(filename: string): string {
    const projectDir = path.resolve(this.viteConfig.root!, "..");
    const ui5Dir = path.join(projectDir, "ui5");

    return normalizePath(path.join(ui5Dir, filename));
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

  /**
   * Returns all files in folder (first level)
   *
   *
   * @param folderPath
   * @param extensions
   * @private
   */
  private async getFilesInDir(folderPath: string, extensions: Array<string>): Promise<string[]> {
    const files = await new Promise<Dirent[]>((resolve, reject) =>
      fs.readdir(folderPath, { withFileTypes: true }, (error, files) => (error ? reject(error) : resolve(files))),
    );

    const filteredFiles = files.filter((f) => f.isFile()).filter((f) => extensions.includes(path.extname(f.name)));

    return filteredFiles.map((f) => path.join(folderPath, f.name));
  }
}
