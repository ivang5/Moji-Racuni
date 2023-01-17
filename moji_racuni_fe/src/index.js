import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "react-datepicker/dist/react-datepicker.css";
import "react-dropdown/style.css";
import "./scss/bundle.scss";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  //<React.StrictMode>
  <App />
  //</React.StrictMode>
);
