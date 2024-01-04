import "./App.css";
import viteLogo from "/vite.svg";
import { FC, useState } from "react";
import { RenderOptions } from "virtual:ui5-register-app";
import reactLogo from "./assets/react.svg";

export interface AppProps {
  config?: RenderOptions;
}

const App: FC<AppProps> = () => {
  const [count, setCount] = useState(0);

  return (
    <div className="app">
      <div>
        <a href="https://vitejs.dev" target="_blank">
          <img src={viteLogo} className="logo" alt="Vite logo" />
        </a>
        <a href="https://react.dev" target="_blank">
          <img src={reactLogo} className="logo react" alt="React logo" />
        </a>
      </div>
      <h1>{import.meta.env.VITE_APP_TITLE}</h1>
      <div className="card">
        <button onClick={() => setCount((count) => count + 1)}>count is {count}</button>

        <button
          onClick={async () => {
            const { test } = await import("./test.ts");
            alert(test);
          }}
        >
          Load Async Chunk
        </button>
        <p>
          Edit <code>src/App.tsx</code> and save to test HMR
        </p>
      </div>
      <p className="read-the-docs">Click on the Vite and React logos to learn more</p>
    </div>
  );
};

export default App;
