import crypto from "crypto";
import {
  NormalizedInputOptions,
  NormalizedOutputOptions,
  OutputAsset,
  OutputBundle,
  OutputChunk,
  PluginContext,
} from "rollup";
import { normalizePath } from "vite";
import { BasePlugin } from "./BasePlugin.ts";

export class BuildPlugin extends BasePlugin {
  async buildStart(context: PluginContext, options: NormalizedInputOptions) {
    const files = await this.getAdditionalUi5Files();
    files.forEach((f) => context.emitFile(f));
  }

  generateBundle = async (
    context: PluginContext,
    options: NormalizedOutputOptions,
    bundle: OutputBundle,
    isWrite: boolean,
  ) => {
    const allEntries = Object.values(bundle)
      .filter((output): output is OutputChunk => output.type === "chunk")
      .filter((outputChunk) => outputChunk.isEntry);

    const ui5JsEntry = allEntries.find((outputChunk) => outputChunk.name === "main");

    if (!ui5JsEntry) {
      context.error("UI5 file not found: main.js/ts");
    }
    const ui5Component = allEntries.find((outputChunk) => outputChunk.name === "Component");

    if (!ui5Component) {
      context.error("UI5 file not found: Component.js/ts");
    }

    const entryFileName = normalizePath(ui5JsEntry.facadeModuleId!).replace(
      normalizePath(this.viteConfig.root ?? ""),
      "",
    );

    ui5Component.code = ui5Component.code.replace(entryFileName, ui5JsEntry.fileName);
    ui5Component.map = null;

    const componentPreload = this.generateComponentPreload(context, bundle);

    // enhance Vite's bundle to build the whole cache buster json
    const bundleUI5Enhanced: OutputBundle = {
      ...bundle,
      [componentPreload.fileName]: componentPreload,
    };

    const cacheBuster = this.generateCacheBuster(context, bundleUI5Enhanced);

    // emit all files
    for (const file of [componentPreload, cacheBuster]) {
      context.emitFile(file);
    }
  };

  private generateComponentPreload(context: PluginContext, bundle: OutputBundle): OutputAsset {
    const allUI5Chunks = Object.values(bundle)
      .filter((output): output is OutputChunk => output.type === "chunk")
      .filter((outputChunk) => outputChunk.isEntry)
      .filter((output) => output.name === "Component");

    const allUI5Assets = Object.values(bundle)
      .filter((output): output is OutputAsset => output.type === "asset")
      .filter((output) => output.fileName === "manifest.json");

    const appFiles = [...allUI5Chunks, ...allUI5Assets];

    const { ui5NamespacePath } = this;

    return {
      name: "Component-preload.js",
      fileName: "Component-preload.js",
      type: "asset",
      needsCodeReference: false,
      source: `sap.ui.require.preload(${JSON.stringify(
        appFiles.reduce<{
          [file: string]: string;
        }>((map, file) => {
          map[`${ui5NamespacePath}/${file.fileName}`] = file.type === "chunk" ? file.code : file.source.toString();
          return map;
        }, {}),
        null,
        "\t",
      )}, "${ui5NamespacePath}/Component-preload");`,
    };
  }

  private generateCacheBuster(context: PluginContext, bundle: OutputBundle): OutputAsset {
    const hashes = Object.entries(bundle).map(([filename, output]) => {
      const hasher = crypto.createHash("sha1");
      hasher.update(output.type === "asset" ? output.source : output.code);
      const hash = hasher.digest("hex");

      return {
        name: filename,
        hash: hash,
      };
    });

    const cacheBusterInfo = hashes.reduce<Record<string, string>>((map, asset) => {
      map[asset.name] = asset.hash;
      return map;
    }, {});

    return {
      type: "asset",
      name: "sap-ui-cachebuster-info.json",
      needsCodeReference: false,
      fileName: "sap-ui-cachebuster-info.json",
      source: JSON.stringify(cacheBusterInfo, null, 2),
    };
  }
}
