import React from 'react';
import { Link } from 'react-router-dom';

export default function NotFound () {
  return (
    <div style={styles.container}>
      <h1 style={styles.header}>404 Not Found</h1>
      <p style={styles.text}>Sorry, the page you're looking for doesn't exist.</p>
      <Link to="/" style={styles.link}>Go Back to Home</Link>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100vh',
  },
  header: {
    fontSize: '2rem',
    color: '#333',
  },
  text: {
    fontSize: '1.2rem',
    marginBottom: '20px',
  },
  link: {
    fontSize: '1rem',
    color: '#007bff',
    textDecoration: 'none',
  },
};

