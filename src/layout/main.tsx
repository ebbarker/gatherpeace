import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "../index.css";
import {
  Routes,
  Route,
  BrowserRouter,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
} from "react-router-dom";
import MessageBoard from "../MessageBoard";
import '../custom.scss';
import * as Sentry from "@sentry/react";

// Sentry.init({
//   dsn: "https://5a282404b548c3304777f4db6615b992@o4505705490350080.ingest.sentry.io/4505705494478848",
//   integrations: [
//     new Sentry.BrowserTracing({
//       routingInstrumentation: Sentry.reactRouterV6Instrumentation(
//         React.useEffect,
//         useLocation,
//         useNavigationType,
//         createRoutesFromChildren,
//         matchRoutes
//       ),
//     }),
//   ],
//   tracesSampleRate: 1.0,
// });

//const SentryRoutes = Sentry.withSentryReactRouterV6Routing(Routes);

// ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
//   <BrowserRouter>
//     <SentryRoutes>
//       <Route path="/" element={<div>Home</div>} />
//     </SentryRoutes>
//   </BrowserRouter>
// );


ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  // <React.StrictMode>
  <App />
  // </React.StrictMode>
);
