<p align="center">
  <img alt="VTEX Admin" src="./assets/vtex_logo.svg" height="100" />
  <h3 align="center">splunk-react</h3>
  <p align="center">Reach us at #frontend-monitoring channel on Slack</p>
</p>

---

## SplunkMonitoring

```ts
const monitoring = new SplunkMonitoring({
  token: "12345",
  endpoint: "http://my-splunk-endpoint:9999",
  // Only set `vtexIO` info in case your app
  // is running on top of VTEX IO
  vtexIO: {
    runtimeInfo: {
      account: global.__RUNTIME__.account,
      workspace: global.__RUNTIME__.workspace,
      renderMajor: global.__RUNTIME__.renderMajor,
      production: global.__RUNTIME__.production,
    },
    appInfo: {
      appId: process.env.VTEX_APP_ID as string,
      appVersion: process.env.VTEX_APP_VERSION as string,
    },
  },
});
```

## High order methods available in this application

### withErrorBoundary monitoring

```tsx
import { SplunkMonitoring, withErrorBoundary } from "splunk-react";

const monitoring = new SplunkMonitoring({
  // Your config here
});

const App = () => <div>Hello world</div>;

const AppWithErrorBoundaryMonitoring = withErrorBoundary(monitoring)(App);
```
