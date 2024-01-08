import { PluginObj } from "@babel/core";
import * as babel from "@babel/core";
// @ts-ignore
import _template from "@babel/template";
import type { Statement } from "@babel/types";

// @ts-ignore: see https://github.com/babel/babel/issues/13719
const template: typeof _template = _template.default;

export interface InjectCodePluginOptions {
  source: string;
}
export const injectCodePlugin = ({ types: t }: typeof babel): PluginObj => {
  return {
    name: "injectCodePlugin",
    visitor: {
      Program: function (path, { opts }: any) {
        path.node.body.unshift(template.ast(opts.source) as Statement);
      },
    },
  };
};
