import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../index.css";
import { createBrowserRouter, RouterProvider, Route } from "react-router-dom";
import MessageBoard from "../MessageBoard";
import 'bootstrap/dist/css/bootstrap.min.css';

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
