import crypto from "crypto";
import path from "path";
import { EmittedAsset, ModuleInfo, NormalizedOutputOptions, OutputAsset, OutputBundle, PluginContext } from "rollup";
import { normalizePath } from "vite";
import { BasePlugin } from "./BasePlugin.ts";

export class BuildPlugin extends BasePlugin {
  generateBundle = async (
    context: PluginContext,
    options: NormalizedOutputOptions,
    bundle: OutputBundle,
    isWrite: boolean,
  ) => {
    const ui5Files = await this.generateUI5Files(context, bundle);

    // enhance Vite's bundle to build the whole cache buster json
    const bundleUI5Enhanced: OutputBundle = {
      ...bundle,
      ...ui5Files.reduce<OutputBundle>(
        (map, file) => ({
          ...map,
          [file.fileName ?? file.name ?? ""]: {
            ...file,
            needsCodeReference: false,
          } as OutputAsset,
        }),
        {},
      ),
    };
    const cacheBuster = this.generateCacheBuster(context, bundleUI5Enhanced);

    // emit all files
    for (const file of [...ui5Files, cacheBuster]) {
      context.emitFile(file);
    }
  };

  private async generateUI5Files(
    context: PluginContext,
    bundle: OutputBundle,
  ): Promise<Array<EmittedAsset & { id: string }>> {
    const ui5Entry = Array.from(context.getModuleIds())
      .map((file) => context.getModuleInfo(file))
      .filter((mod): mod is ModuleInfo => !!mod)
      .filter((mod) => mod.isEntry)
      .filter((mod) => [".tsx", ".ts", ".js"].includes(path.extname(mod.id)))
      .pop();

    if (!ui5Entry) {
      context.error("UI5 Entry file not found!");
    }

    const ui5EntryOuput = Object.values(bundle).find(
      (output) => output.type === "chunk" && output.facadeModuleId === ui5Entry.id,
    );

    if (!ui5EntryOuput || ui5EntryOuput.type !== "chunk") {
      context.error("Output file not found!");
    }

    // TODO handle CSS files --> 3rd party plugin for now
    const cssFiles = ui5EntryOuput.viteMetadata!.importedAssets;

    const ui5Files = await this.getUi5Files({
      entryFilename: normalizePath(ui5Entry.id).replace(normalizePath(this.viteConfig.root ?? ""), ""),
      outputFilename: ui5EntryOuput.fileName,
    });

    return ui5Files;
  }

  private generateCacheBuster(context: PluginContext, bundle: OutputBundle): EmittedAsset {
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
      fileName: "sap-ui-cachebuster-info.json",
      source: JSON.stringify(cacheBusterInfo, null, 2),
    };
  }
}
