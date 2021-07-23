import React, { useEffect, useState } from "react";
import ReactDOM from "react-dom";

import { SplunkMonitoring, withErrorBoundary } from "../src";
import { bomb } from "./bomb";

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
  token: "12345",
  endpoint: "http://some-where-over-the-rainbow:9999",
});

const WithErrorBoundary = withErrorBoundary(monitoring)(App);

ReactDOM.render(
  <React.StrictMode>
    <WithErrorBoundary />
  </React.StrictMode>,
  document.getElementById("root")
);
