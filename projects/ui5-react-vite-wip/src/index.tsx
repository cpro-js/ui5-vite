import "./main";

import { RenderOptions, render } from "virtual:ui5-register-app";

const options: RenderOptions = {
  resolveUri: (path) => path,
};

render(document.getElementById("root")!, options);
