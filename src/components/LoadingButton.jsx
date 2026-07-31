'use client';
import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import './LoadingButton.css';

const LoadingButton = ({ 
  children, 
  isLoading = false, 
  onClick, 
  disabled = false, 
  type = "button", 
  className = "btn btn-primary",
}) => {
  return (
    <button
      type={type}
      className={`${className} loading-button ${isLoading ? 'loading' : ''}`}
      aria-busy={isLoading}
      onClick={onClick}
      disabled={disabled || isLoading}
    >
      <AnimatePresence mode="wait">
        {isLoading ? (
          <motion.div
            key="spinner"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="spinner-container"
          >
            <div className="dot-spinner" aria-hidden="true">
              <div className="dot-spinner__dot" />
              <div className="dot-spinner__dot" />
              <div className="dot-spinner__dot" />
              <div className="dot-spinner__dot" />
              <div className="dot-spinner__dot" />
              <div className="dot-spinner__dot" />
              <div className="dot-spinner__dot" />
              <div className="dot-spinner__dot" />
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="content"
            initial={{ opacity: 0, y: 5 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -5 }}
            style={{ display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            {children}
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};

export default LoadingButton;
