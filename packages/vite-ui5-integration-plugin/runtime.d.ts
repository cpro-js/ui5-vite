declare module "virtual:@cpro-js/vite-ui5-integration-plugin/runtime" {
  export interface RenderOptions {}

  export function register(render: (rootNode: HTMLElement, options?: RenderOptions) => () => void): void;

  export function render(rootNode: HTMLElement, options?: RenderOptions): Promise<() => void>;
}
