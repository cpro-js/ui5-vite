import { ConfigEnv, Plugin, UserConfig } from "vite";

export interface Ui5ViteAppPluginOptions {
  appId: string;
}

export default class Ui5ViteAppPlugin implements Plugin {
  name = "ui5-vite-app";

  _config!: UserConfig;
  constructor(private pluginOptions: Ui5ViteAppPluginOptions) {}

  config = async (config: UserConfig, { command }: ConfigEnv) => {
    this._config = config;
  };
}
