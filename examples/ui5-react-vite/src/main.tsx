// https://vitejs.dev/config/build-options.html#build-modulepreload
import "vite/modulepreload-polyfill";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { register } from "virtual:@cpro-js/vite-ui5-integration-plugin/runtime";
import { App } from "./App.tsx";

register((rootNode, options) => {
  const root = createRoot(rootNode);
  console.log("render");

  root.render(
    <StrictMode>
      <App config={options} />
    </StrictMode>,
  );

  // => clean up
  return () => {
    console.log("unmount");
    root.unmount();
  };
});
