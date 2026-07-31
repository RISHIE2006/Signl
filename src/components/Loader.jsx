'use client';
import React from 'react';
import './LoadingButton.css'; // Reusing the same CSS for consistent animations

const Loader = ({ size = "1.5rem", color = "currentColor" }) => {
  return (
    <div className="dot-spinner" style={{ '--uib-size': size, '--uib-color': color }}>
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
      <div className="dot-spinner__dot" />
    </div>
  );
};

export default Loader;
