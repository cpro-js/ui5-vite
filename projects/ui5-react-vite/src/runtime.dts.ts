/// <reference types="@cpro-js/ui5-vite-app-plugin/runtime" />
import type Component from "../ui5/Component.ts";

declare module "virtual:@cpro-js/ui5-vite-app-plugin/runtime" {
  // enhance RenderOptions

  interface RenderOptions {
    component?: Component;
  }
}
