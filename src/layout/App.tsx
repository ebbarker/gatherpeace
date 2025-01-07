import React, { createContext, useEffect, useState, useContext } from 'react';
import {
  BrowserRouter,
  createBrowserRouter,
  Outlet,
  RouterProvider,
  Routes,
  Route,
  useLocation,
  useNavigationType,
  createRoutesFromChildren,
  matchRoutes,
  useNavigate,
} from 'react-router-dom';
import { AllPosts } from '../AllPosts';
import './App.css';
import Home from './Home';
import MessageBoard from '../MessageBoard';
import NavBar from '../navbar/NavBar';
import { PostView } from '../PostView';
import PrivacyPolicy from '../legal/PrivacyPolicy';
import TermsOfService from '../legal/TermsOfService';
import { SupashipUserInfo, useSession } from './use-session';
import { Welcome, welcomeLoader } from './Welcome';
import * as Sentry from '@sentry/react';
import { VoteProvider } from '../contexts/VoteContext';
import { LetterView } from '../letterTemplates/LetterView';
import PublicUserProfile from '../user-profile/PublicUserProfile.jsx';
import PrivateUserProfile from '../user-profile/PrivateUserProfile.jsx';
import NotFound from '../not-found/NotFound.jsx';
import { supaClient } from "./supa-client";
import { ListOfNames } from "../listOfNames/ListOfNames";
import { Notifications } from "../notifications/Notifications";
import { NotificationsProvider } from "../notifications/NotificationsContext";
import  UserSettings from "../user-profile/UserSettings";
import Footer from "./Footer";
import ContactPage from "./ContactPage";
import SubmitArt from "./SubmitArt";

Sentry.init({
  dsn: 'https://5a282404b548c3304777f4db6615b992@o4505705490350080.ingest.sentry.io/4505705494478848',
  integrations: [
    new Sentry.BrowserTracing({
      routingInstrumentation: Sentry.reactRouterV6Instrumentation(
        React.useEffect,
        useLocation,
        useNavigationType,
        createRoutesFromChildren,
        matchRoutes,
      ),
    }),
  ],
  tracesSampleRate: 1.0,
});



const sentryCreateBrowserRouter = Sentry.wrapCreateBrowserRouter(createBrowserRouter);

export const router = sentryCreateBrowserRouter([
  {
    path: '/',
    element: <Layout />,
    children: [
      { path: '', element: <Home /> },
      {
        path: 'peace-wall',
        element: <MessageBoard />,
        children: [
          {
            path: ':pageNumber',
            element: <AllPosts />,
          },
          {
            path: 'post/:postId',
            element: <PostView />,
          },
          {
            path: 'letter/:LetterId',
            element: <LetterView />,
          },

        ],
      },
      {
        path: 'notifications',
        element: <Notifications />,
        children: [
          {
            path: ':pageNumber',
            element: <AllPosts />,
          },
        ]
      },
      {
        path: 'welcome',
        element: <Welcome />,
        loader: welcomeLoader,
      },
      { path: 'privacy-policy', element: <PrivacyPolicy /> },
      { path: 'terms-of-service', element: <TermsOfService /> },
      { path: 'profile', element: <PrivateUserProfile /> },
      { path: 'settings', element: <UserSettings /> },
      { path: 'signatories', element: <ListOfNames /> },
      { path: 'contact', element: <ContactPage /> },
      { path: 'submit-art', element: <SubmitArt /> },
      {
        path: '*', // Use a wildcard to capture all other routes
        element: <CatchAllRoutes />,
      },
    ],
  },
]);

function CatchAllRoutes() {
  let location = useLocation();
  let match = location.pathname.match(/^\/@(.+)/);

  if (match) {
    return <PublicUserProfile profileName={match[1]} />;
  } else {
    return <NotFound />; // Render a Not Found page for other unmatched routes
  }
}

export const UserContext = createContext<SupashipUserInfo>({
  session: null,
  profile: null,
  updateProfile: () => {},
  setUser: ()=> {}
});

function Layout() {
  const { session, profile, updateProfile } = useSession();
  const [user, setUser] = useState(null)
  const location = useLocation();
  const navigate = useNavigate();

  // useEffect(() => {

  //   const { data: authListener } = supaClient.auth.onAuthStateChange((event, session) => {
  //     if (session) {
  //       // console.log ('running user effect');
  //       // setUser(session.user);
  //       // const returnPath = localStorage.getItem('returnPath') || '/';
  //     //  navigate(returnPath);
  //       // localStorage.removeItem('returnPath');
  //     } else {
  //       setUser(null);
  //     }
  //   });

  //   return () => {
  //     authListener?.subscription.unsubscribe();
  //   };
  // }, [setUser]);

  return (
<UserContext.Provider value={{ session, profile, updateProfile }}>
      <div className="layout-container">
        <VoteProvider>
          <NotificationsProvider>
            <NavBar />
            <div className="content-container">
              <Outlet />
            </div>
            <Footer />
          </NotificationsProvider>
        </VoteProvider>
      </div>
    </UserContext.Provider>
  );
}

function App() {
  return <RouterProvider router={router} />;
}

export default App;
