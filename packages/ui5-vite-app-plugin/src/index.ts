import { ConfigEnv, Plugin, UserConfig } from "vite";
import { BuildPlugin } from "./plugin/BuildPlugin.ts";

export interface Ui5ViteAppPluginOptions {
  appId: string;
}

export default (options: Ui5ViteAppPluginOptions): Plugin => {
  let plugin: BuildPlugin, userConfig: UserConfig, configEnv: ConfigEnv;
  return {
    name: "ui5-vite-app",
    config(config: UserConfig, env: ConfigEnv) {
      userConfig = config;
      configEnv = env;
      if (configEnv.command === "build") {
        plugin = new BuildPlugin(config, configEnv, options);
      }

      plugin?.config();
    },
    load(id) {
      return plugin?.load(id);
    },
    resolveId(id) {
      return plugin?.resolveId(id);
    },
    generateBundle(options, bundle, isWrite) {
      return plugin?.generateBundle(this, options, bundle, isWrite);
    },
  };
};
