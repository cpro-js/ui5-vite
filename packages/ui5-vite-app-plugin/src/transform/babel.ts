import babel, { PluginObj } from "@babel/core";
import presetEnv, { Options as PresetEnvOptions } from "@babel/preset-env";
// @ts-ignore
import presetTypescript from "@babel/preset-typescript";
import _template from "@babel/template";
import type { Statement } from "@babel/types";
// @ts-ignore
import transformUI5 from "babel-plugin-transform-modules-ui5";
import removeImportsPlugin, { Options as RemoveImportsOptions } from "babel-plugin-transform-remove-imports";

// @ts-ignore: see https://github.com/babel/babel/issues/13719
const template: typeof _template = _template.default;
const runtimePlugin = ({ types: t }: typeof babel): PluginObj => {
  return {
    name: "example",
    visitor: {
      Program: function (path, { opts }: any) {
        path.node.body.unshift(
          template.ast(`
  const render = function(...args) {
    window["UI5_RUNNER@${opts.appId}"].start(...args);
  };`) as Statement,
        );
      },
    },
  };
};

export const transformUi5Code = (
  filename: string,
  code: string,
  options: {
    appId: string;
  },
): string => {
  const result = babel.transform(code, {
    filename: filename,
    plugins: [
      [removeImportsPlugin, <RemoveImportsOptions>{ test: "virtual:@cpro-js/ui5-vite-app-plugin/runtime" }],
      [
        transformUI5,
        {
          autoConvertAllExtendClasses: true,
        },
      ],
      [runtimePlugin, { appId: options.appId }],
    ],
    presets: [
      [
        presetEnv,
        <PresetEnvOptions>{
          modules: false,
          useBuiltIns: false,
          bugfixes: true,
        },
      ],
      presetTypescript,
    ],
  });

  if (!result) {
    throw new Error("Something went wrong!");
  }

  return result.code ?? "";
};
