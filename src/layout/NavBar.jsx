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



export default function NavBar() {
  const { session, profile } = useContext(UserContext);


  return (
    <>
      <div class="header-container">
      <nav class="navbar navbar-expand-lg">


        <a class="navbar-brand" href="#">
          <div class="logo-container">

              <div class="navbar-home">
              <Link className="nav-logo-link" to="/">
                <img
                  id="logo"
                  class="nav-logo"
                  src={twitterPeace}
                  alt="logo"
                />
                </Link>
              </div>

          </div>
        </a>


      <a class="navbar-brand mr-auto" href="#"><Link className="nav-logo-link" to="/">Gather Peace</Link></a>

        <button class="navbar-toggler" type="button" data-toggle="collapse" data-target="#navbarSupportedContent" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        ☰
        </button>

        <div class="collapse navbar-collapse my-2 my-lg-0" id="navbarSupportedContent">

          <ul class="navbar-menu-right navbar-nav ml-auto">
            <li class="nav-item active nav-item-custom">
              <a class="nav-link" href="#"><Link className="nav-home-link" to="/">Home </Link><span class="sr-only">(current)</span></a>
            </li>
            <li class="nav-item">
              <a class="nav-link" href="#"><Link className="nav-home-link" to="/peace-wall/1">Peace Wall</Link></a>
            </li>

            <li>
            {session?.user ?
              <li class="nav-item dropdown">

                <a class="nav-link dropdown-toggle" href="#" id="navbarDropdown" role="button" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
                {profile?.username || "Welcome"}
                </a>
                <ul class="dropdown-menu dropdown-menu-right">
                  <a class="dropdown-item" href="#" onClick={() => supaClient.auth.signOut()}>
                        Logout
                      </a>
                  <div class="dropdown-divider"></div>
                  <a class="dropdown-item" href="#">Something else here</a>
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