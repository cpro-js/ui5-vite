import "./main";
import { render, RenderOptions } from "virtual:@cpro-js/ui5-vite-app-plugin/runtime";

const options: RenderOptions = {
  resolveUri: (path) => path,
};

render(document.getElementById("root")!, options);
