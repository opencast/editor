import React from "react";
import ReactDOMClient from "react-dom/client";
import "./index.css";
import App from "./App";
import { Provider } from "react-redux";
import store from "./redux/store";

import { init } from "./config";
import { sleep } from "./util/utilityFunctions";

import "@fontsource-variable/roboto-flex";

import "./i18n/config";

import "@opencast/appkit/dist/colors.css";
import { ColorSchemeProvider } from "@opencast/appkit";
import { PersistGate } from "redux-persist/lib/integration/react";
import { persistStore } from "redux-persist";
import { HotkeysProvider } from "react-hotkeys-hook";
import { HOTKEY_SCOPE } from "./globalKeys";

const container = document.getElementById("root");
if (!container) {
  throw new Error("Failed to find the root element");
}
const root = ReactDOMClient.createRoot(container);

// Commenting persistent stuff out can help with debugging
const persistor = persistStore(store);

// Load config here
// Load the rest of the application and try to fetch the settings file from the
// server.
const initialize = Promise.race([
  init(),
  sleep(600),
]);

initialize.then(

  () => {
    root.render(
      <React.StrictMode>
        <Provider store={store}>
          <PersistGate loading={<div>loading...</div>} persistor={persistor}>
            <ColorSchemeProvider>
              <HotkeysProvider initiallyActiveScopes={[HOTKEY_SCOPE]}>
                <App />
              </HotkeysProvider>
            </ColorSchemeProvider>
          </PersistGate>
        </Provider>
      </React.StrictMode>,
    );
  },

  // This error case is very unlikely to occur.
  (e: Error) => root.render(<p>
    {`Fatal error while loading app: ${e.message}`}
    <br />
    This might be caused by a incorrect configuration by the system administrator.
  </p>),
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals

