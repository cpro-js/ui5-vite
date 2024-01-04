// https://vitejs.dev/config/build-options.html#build-modulepreload
import "vite/modulepreload-polyfill";
import "./main.css";
import { StrictMode } from "react";
import ReactDOM from "react-dom/client";
import { register } from "virtual:ui5-register-app";
import App from "./App.tsx";

register((rootNode, options) => {
  console.log("render", rootNode, options);
  const root = ReactDOM.createRoot(rootNode);
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
