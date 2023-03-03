import { createContext, useState } from 'react';
import reactLogo from './assets/react.svg';
import './App.css';
import { createBrowserRouter, RouterProvider, Outlet } from 'react-router-dom';
import MessageBoard from './MessageBoard';
import AllPosts from './AllPosts';
import PostView from './PostView';
import Welcome from './Welcome';
import NavBar from './NavBar';
import { SupashipUserInfo, useSession } from './use-session';

const router = createBrowserRouter([
  {
    path: "/",
    element: <Layout />,
    children: [
      {
        path: "",
        element: <MessageBoard />,
        children: [
          {
            path: ":pageNumber",
            element: <AllPosts />,
          },
          {
            path: "posts/:postId",
            element: <PostView />,
          },
        ],
      },
      {
        path: "Welcome",
        element: <Welcome />,
      },
    ],
  },
]);

function App() {
  return <RouterProvider router={router} />;
}

export default App;

export const UserContext = createContext<SupashipUserInfo>({
  session: null,
  profile: null,
});

function Layout() {
  const SupashipUserInfo = useSession();

  return (
    <>
      <UserContext.Provider value={SupashipUserInfo}>
        <NavBar />
        <Outlet />
      </UserContext.Provider>
    </>
  )
}
