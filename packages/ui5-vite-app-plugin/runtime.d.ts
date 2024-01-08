declare module "virtual:@cpro-js/ui5-vite-app-plugin/runtime" {
  export interface RenderOptions {}

  export function register(render: (rootNode: HTMLElement, options?: RenderOptions) => () => void): void;

  export function render(rootNode: HTMLElement, options?: RenderOptions): () => void;
}
