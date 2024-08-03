import { useContext, useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "../layout/App";
import Login from "../layout/Login";
import twitterPeace from "../img/twitterpeace2.png";
import { supaClient } from "../layout/supa-client";
import DarkMode from "../DarkMode";
import { IoNotificationsSharp } from "react-icons/io5";
import "./NavBar.css";
import { NotificationsContext } from '../notifications/NotificationsContext';


export default function NavBar() {
  const { session, profile } = useContext(UserContext);
  const { notifications } = useContext(NotificationsContext);
  const [unreadCount, setUnreadCount] = useState('');

  useEffect(() => {
    let count = 0;
    for (let i = 0; i < notifications.length; i++) {
      count += notifications[i].unread_count;
    }
    setUnreadCount(count);
  }, [notifications]);


  return (
    <>
      <div className="header-container">
        <nav className="navbar navbar-expand-lg">
          <div className="logo-container">
            <div className="navbar-home">
              <Link className="nav-logo-link" to="/">
                <img
                  id="logo"
                  className="nav-logo"
                  src={twitterPeace}
                  alt="logo"
                />
              </Link>
            </div>
          </div>

          <Link className="navbar-brand mr-auto nav-logo-link" to="/">
            Gather Peace
          </Link>

          <button
            className="navbar-toggler"
            type="button"
            data-toggle="collapse"
            data-target="#navbarSupportedContent"
            aria-controls="navbarSupportedContent"
            aria-expanded="false"
            aria-label="Toggle navigation"
          >
            ☰
          </button>

          <div
            className="collapse navbar-collapse my-2 my-lg-0"
            id="navbarSupportedContent"
          >
            <ul className="navbar-menu-right navbar-nav ml-auto">
              <li className="nav-item">
                <DarkMode />
              </li>
              <li className="nav-item active nav-item-custom">
                <Link className="nav-home-link nav-link" to="/">
                  Home <span className="sr-only">(current)</span>
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-home-link nav-link" to="/peace-wall/1">
                  Peace Wall
                </Link>
              </li>
              <li className="nav-item">
                <Link className="nav-home-link nav-link" to="/notifications">
                  <div className="notification-container">
                    <div className="notification-icon">
                      <IoNotificationsSharp />
                      {unreadCount ? <div className="notification-badge">{unreadCount}</div> : null}
                    </div>
                  </div>

                </Link>
              </li>

              <li className="navbar-login-container nav-item">
                {session?.user ? (
                  <>
                    <a
                      className="nav-link dropdown-toggle"
                      href="#"
                      id="navbarDropdown"
                      role="button"
                      data-toggle="dropdown"
                      aria-haspopup="true"
                      aria-expanded="false"
                    >
                      {profile?.username || "Welcome"}
                    </a>
                    <ul className="dropdown-menu dropdown-menu-right">
                      <a className="dropdown-item" href="/profile">
                        My Profile
                      </a>
                      <div className="dropdown-divider"></div>
                      <a
                        className="dropdown-item"
                        href="#"
                        onClick={() => supaClient.auth.signOut()}
                      >
                        Logout
                      </a>


                    </ul>
                  </>
                ) : (
                  <Login />
                )}
              </li>
            </ul>
          </div>
        </nav>
      </div>
    </>
  );
}
