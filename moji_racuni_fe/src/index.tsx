import React from "react";
import ReactDOM from "react-dom/client";
import { QueryClientProvider } from "@tanstack/react-query";
import App from "./App";
import { queryClient } from "./api/queryClient";
import "react-datepicker/dist/react-datepicker.css";
import "react-dropdown/style.css";
import "./scss/bundle.scss";

const rootElement = document.getElementById("root");

if (!rootElement) {
  throw new Error("Root element with id 'root' is missing.");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  //<React.StrictMode>
  <QueryClientProvider client={queryClient}>
    <App />
  </QueryClientProvider>,
  //</React.StrictMode>
);
