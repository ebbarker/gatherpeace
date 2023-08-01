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
import {
  MDBContainer,
  MDBCollapse,
  MDBNavbar,
  MDBNavbarToggler,
  MDBIcon,
  MDBBtn,
} from 'mdb-react-ui-kit';


export default function Hamburger() {


  const [isOpen, setIsOpen] = useState(false);

  const toggleMenu = () => {
    preventDefault();
    setIsOpen(!isOpen);
  };

  return (






    <div>

      <button onClick={toggleMenu} className="hamburger-menu">
        ☰
      </button>

      {isOpen && (
        <div className="mobile-menu modal">
          <ul>
            <li>
              <Link to="/">Home</Link>
            </li>
            <li>
              <Link to="/message-board/1">Peace Wall</Link>
            </li>
            <li>
              <Link to="/wishing-well">Wishing Well</Link>
            </li>
            <li>
              <Link to="/about">About</Link>
            </li>
            <li>
              {/* The login/user menu functionality goes here */}
            </li>
          </ul>
        </div>
      )}
    </div>


  );






}