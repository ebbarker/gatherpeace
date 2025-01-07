import React from 'react';
import { Link } from 'react-router-dom';
import './Footer.css'; // Optional: Add your CSS styles

export default function Footer () {
  return (
<footer className="footer">
  <div className="footer-links">
    <Link to="/privacy-policy" className="footer-link">Privacy Policy</Link>
    <Link to="/terms-of-service" className="footer-link">Terms of Service</Link>
    <Link to="/contact" className="footer-link">Contact</Link>
    <Link to="/contact" className="footer-link">Collaborate</Link>
  </div>
  <div className="footer-copyright">
    &copy; 2024 Gather Peace. All rights reserved.
  </div>
</footer>
  );
};

