import path from "path";
import { ModuleInfo, NormalizedOutputOptions, OutputBundle, PluginContext } from "rollup";
import { normalizePath } from "vite";
import { BasePlugin } from "./BasePlugin.ts";

export class BuildPlugin extends BasePlugin {
  generateBundle = async (
    context: PluginContext,
    options: NormalizedOutputOptions,
    bundle: OutputBundle,
    isWrite: boolean,
  ) => {
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

    const ui5Files = this.getUi5Files({
      entryFilename: normalizePath(ui5Entry.id).replace(normalizePath(this.viteConfig.root ?? ""), ""),
      outputFilename: ui5EntryOuput.fileName,
    });

    for (const file of ui5Files) {
      context.emitFile(file);
    }
  };
}
