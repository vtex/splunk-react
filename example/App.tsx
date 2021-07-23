import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { SplunkMonitoring, withErrorBoundary } from "../src";

function bomb() {
  throw new Error("KABOOM!");
}

function App() {
  const [explode, setExplode] = useState(false);

  useEffect(() => {
    if (explode) {
      bomb();
    }
  }, [explode]);

  return <h1 onClick={() => setExplode(true)}>Explode!</h1>;
}

const monitoring = new SplunkMonitoring({
  token: "123",
  endpoint: "123",
  runtimeInfo: {
    account: "a",
    workspace: "b",
    production: false,
    renderMajor: 8,
  },
});

const WithErrorBoundary = withErrorBoundary(monitoring)(App);

ReactDOM.render(
  <React.StrictMode>
    <WithErrorBoundary />
  </React.StrictMode>,
  document.getElementById("root")
);
