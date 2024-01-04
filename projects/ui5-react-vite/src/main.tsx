// https://vitejs.dev/config/build-options.html#build-modulepreload
import "vite/modulepreload-polyfill";
import "./main.css";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { register } from "virtual:@cpro-js/ui5-vite-app-plugin/runtime";
import { App } from "./App.tsx";

register((rootNode, options) => {
  const root = createRoot(rootNode);
  root.render(
    <StrictMode>
      <App config={options} />
    </StrictMode>,
  );

  // => clean up
  return () => {
    root.unmount();
  };
});
