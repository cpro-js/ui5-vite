import viteLogo from "/vite.svg";
import { FC, lazy } from "react";
import { RenderOptions } from "virtual:@cpro-js/vite-ui5-integration-plugin/runtime";
import reactLogo from "./assets/react.svg";
import ui5Logo from "./assets/ui5.svg";
import "./App.css";

const Counter = lazy(() => import("./Counter").then((mod) => ({ default: mod.Counter })));

export interface AppProps {
  config?: RenderOptions;
}

export const App: FC<AppProps> = () => {
  return (
    <div className="app-container">
      <div className="app">
        <div>
          <a href="https://vitejs.dev" target="_blank">
            <img src={viteLogo} className="logo" alt="Vite logo" />
          </a>
          <a href="https://react.dev" target="_blank">
            <img src={reactLogo} className="logo react" alt="React logo" />
          </a>
          <a href="https://sapui5.hana.ondemand.com/" target="_blank">
            <img src={ui5Logo} className="logo ui5" alt="UI5 logo" />
          </a>
        </div>
        <h1>{import.meta.env.VITE_APP_TITLE}</h1>
        <Counter />
      </div>
    </div>
  );
};
