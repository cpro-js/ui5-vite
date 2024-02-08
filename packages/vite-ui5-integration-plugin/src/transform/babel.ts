import babel, { PluginItem } from "@babel/core";
import presetEnv, { Options as PresetEnvOptions } from "@babel/preset-env";
// @ts-ignore
import presetTypescript from "@babel/preset-typescript";
// @ts-ignore
import asyncToPromises from "babel-plugin-transform-async-to-promises";
// @ts-ignore
import transformUI5 from "babel-plugin-transform-modules-ui5";
import removeImportsPlugin, { Options as RemoveImportsOptions } from "babel-plugin-transform-remove-imports";
import { SourceDescription } from "rollup";
import { injectCodePlugin, InjectCodePluginOptions } from "./plugin/injectCodePlugin.ts";

export const transformCode = (
  filename: string,
  code: string,
  options?: {
    removeImport?: string;
    transformUi5?: boolean;
    codeToInject?: string;
  },
): Partial<SourceDescription> => {
  const result = babel.transform(code, {
    filename: filename,
    plugins: ([] as PluginItem[]).concat(
      options?.removeImport ? [[removeImportsPlugin, <RemoveImportsOptions>{ test: options.removeImport }]] : [],
      [
        [
          asyncToPromises,
          {
            inlineHelpers: true,
          },
        ],
      ],
      options?.transformUi5
        ? [
            [
              transformUI5,
              {
                autoConvertAllExtendClasses: true,
              },
            ],
          ]
        : [],
      options?.codeToInject ? [[injectCodePlugin, <InjectCodePluginOptions>{ source: options.codeToInject }]] : [],
    ),
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

  return {
    code: result.code ?? "",
    map: result.map,
  };
};
