import { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { UserContext } from "./App";
import Dialog from "./Dialog";
import { EmailListSignup } from "./EmailListSignup";
import Login from "./Login";
import UserMenu from "../UserMenu";
//import puppyLogo from "../img/puppyLogo.jpeg";
import twitterPeace from "../img/twitterpeace.jpg";
import React, { Component } from "react";
import { Navbar, Nav, NavDropdown, Form, FormControl, Button, Container } from "react-bootstrap";



export default function NavBar() {
  const { session } = useContext(UserContext);
  return (
    <>

{/* <nav class="navbar navbar-expand-custom navbar-mainbg">
        <a class="navbar-brand navbar-logo" href="#">Navbar</a>
        <button class="navbar-toggler" type="button" aria-controls="navbarSupportedContent" aria-expanded="false" aria-label="Toggle navigation">
        <i class="fas fa-bars text-white"></i>
        </button>
        <div class="collapse navbar-collapse" id="navbarSupportedContent">
            <ul class="navbar-nav ml-auto">
                <div class="hori-selector"><div class="left"></div><div class="right"></div></div>
                <li class="nav-item">
                    <a class="nav-link" href="javascript:void(0);"><i class="fas fa-tachometer-alt"></i>Dashboard</a>
                </li>
                <li class="nav-item active">
                    <a class="nav-link" href="javascript:void(0);"><i class="far fa-address-book"></i>Address Book</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="javascript:void(0);"><i class="far fa-clone"></i>Components</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="javascript:void(0);"><i class="far fa-calendar-alt"></i>Calendar</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="javascript:void(0);"><i class="far fa-chart-bar"></i>Charts</a>
                </li>
                <li class="nav-item">
                    <a class="nav-link" href="javascript:void(0);"><i class="far fa-copy"></i>Documents</a>
                </li>
            </ul>
        </div>
    </nav> */}



{/* <Navbar className="navbar navbar-dark bg-success">
                        <Navbar.Brand>
                          <Link className="nav-logo-link" to="/">
                            <img
                              id="logo"
                              className="nav-logo"
                              src={twitterPeace}
                              alt="logo"
                              />
                          </Link></Navbar.Brand>

                        <Navbar.Collapse id="navbarScroll">
                            <Nav
                                className="mr-auto my-2 my-lg-0"
                                style={{ maxHeight: '100px' }}
                                navbarScroll
                            >
                                <Nav.Link as={Link} to="/message-board/1">Message Board</Nav.Link>
                                <Nav.Link as={Link} to="/about">About</Nav.Link>
                                <Nav.Link as={Link} to="/contact">Contact</Nav.Link>
                                 <li className="nav-auth-item">
                                  {session?.user ? <UserMenu />  : <Login />}
                                </li>
                            </Nav>

                        </Navbar.Collapse>
                    </Navbar> */}

<nav class="navbar">
  <ul class="navbar-menu-left">
    <li>
      <div class="navbar-home">
        <img
          id="logo"
          class="nav-logo"
          src={twitterPeace}
          alt="logo"
        />
      </div>
    </li>
    <li>
      <a href="#">
        <h1 class="navbar-title">Welcome to Gather Peace</h1>
      </a>
    </li>
  </ul>
  <ul class="navbar-menu-right">
    <li class="sub-menu">
      <a href="#">
        Peace Wall
        <i class="fa fa-angle-down"></i>
      </a>
    </li>
    <li class="sub-menu">
      <a href="#">
        Wishing Well
        <i class="fa fa-angle-down"></i>
      </a>
    </li>
    <li class="sub-menu">
      <a href="#">
        Services
        <i class="fa fa-angle-down"></i>
      </a>
    </li>
  </ul>
</nav>

</>);
}