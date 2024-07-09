import { useContext, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./App";
import Dialog from "./Dialog";
import { EmailListSignup } from "./EmailListSignup";
import Login from "./Login";
import UserMenu from "../UserMenu";
//import puppyLogo from "../img/puppyLogo.jpeg";
import twitterPeace from "../img/twitterpeace2.png";
import React, { Component } from "react";
import { Navbar, Nav, NavDropdown, Form, FormControl,  Container } from "react-bootstrap";
import Hamburger from "./Hamburger"
import { supaClient } from "./supa-client";
import { Auth, ThemeSupa } from "@supabase/auth-ui-react";
import DarkMode from "../DarkMode";



export default function NavBar() {
  const { session, profile } = useContext(UserContext);


  return (
    <>
      <div className="header-container">
      <nav className="navbar navbar-expand-lg">


        <a className="navbar-brand" href="#">
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
        </a>


      <a className="navbar-brand mr-auto" href="#"><Link className="nav-logo-link" to="/">Gather Peace</Link></a>

        <button className="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        ☰
        </button>

        <div className="collapse navbar-collapse my-2 my-lg-0" id="navbarSupportedContent">

          <ul className="navbar-menu-right navbar-nav ml-auto">
            <li className="nav-item">
              <DarkMode />
            </li>
            <li className="nav-item active nav-item-custom">
              <a className="nav-link" href="#"><Link className="nav-home-link" to="/">Home </Link><span className="sr-only">(current)</span></a>
            </li>
            <li className="nav-item">
              <a className="nav-link" href="#"><Link className="nav-home-link" to="/peace-wall/1">Peace Wall</Link></a>
            </li>

            <li className="navbar-login-container">
            {session?.user ?
              <li className="nav-item dropdown">

                <a className="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                {profile?.username || "Welcome"}
                </a>
                <ul className="dropdown-menu dropdown-menu-right">
                  <a className="dropdown-item" href="#" onClick={() => supaClient.auth.signOut()}>
                        Logout
                      </a>
                  <div className="dropdown-divider"></div>
                  <a className="dropdown-item" href="#">Something else here</a>
                </ul>

                </li>
              : <Login />}
            </li>
          </ul>
        </div>
        </nav>
      </div>
    </>
  );
};