import React from "react";
import { createContext } from "react";
import { createBrowserRouter, Outlet, RouterProvider, Routes,
  Route,
  BrowserRouter,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes, } from "react-router-dom";
import { AllPosts } from "../AllPosts";
import "./App.css";
import Home from "./Home";
import MessageBoard from "../MessageBoard";
import NavBar from "./NavBar";
import { PostView } from "../PostView";
import PrivacyPolicy from "../PrivacyPolicy";
import { SupashipUserInfo, useSession } from "./use-session";
import { Welcome, welcomeLoader } from "./Welcome";
import * as Sentry from "@sentry/react"
import { VoteProvider } from "../contexts/VoteContext"
import { LetterView } from "../LetterView"
import UserProfile from "../user-profile/UserProfile.jsx";
import NotFound from "../not-found/NotFound.jsx";



Sentry.init({
  dsn: "https://5a282404b548c3304777f4db6615b992@o4505705490350080.ingest.sentry.io/4505705494478848",
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes
      ),
    }),
  ],
  tracesSampleRate: 1.0,
});

const sentryCreateBrowserRouter =
  Sentry.wrapCreateBrowserRouter(createBrowserRouter);

// const router = sentryCreateBrowserRouter([
//   // ...
// ]);

export const router = sentryCreateBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      { path: "", element: <Home /> },
      {
        path: "peace-wall",
        element: <MessageBoard />,
        children: [
          {
            path: ":pageNumber",
            element: <AllPosts />,
          },
          {
            path: "post/:postId",
            element: <PostView />,
          },
          {
            path: "letter/:LetterId",
            element: <LetterView />,
          },
        ],
      },
      {
        path: "welcome",
        element: <Welcome />,
        loader: welcomeLoader,
      },
      { path: "privacy-policy", element: <PrivacyPolicy /> },
      { path: "profile", element: <UserProfile profileName={null}/> },
      {
        path: "*", // Use a wildcard to capture all other routes
        element: <CatchAllRoutes />
      },
    ],
  },
]);

function CatchAllRoutes() {
  let location = useLocation();
  let match = location.pathname.match(/^\/@(.+)/);

  if (match) {
    return <UserProfile profileName={match[1]} />;
  } else {
    return <NotFound />; // Render a Not Found page for other unmatched routes
  }
}

export const UserContext = createContext<SupashipUserInfo>({
  session: null,
  profile: null,
});

function App() {
  return <RouterProvider router={router} />;
}

function Layout() {
  const { session, profile } = useSession();
  return (
    <UserContext.Provider value={{ session, profile }}>
      <VoteProvider>
        <NavBar />
        <Outlet />
      </VoteProvider>
    </UserContext.Provider>
  );
}

export default App;
