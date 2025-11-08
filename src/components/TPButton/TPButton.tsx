import React from 'react';
import './TPButton.css';

interface TPButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'alarm';
  children: React.ReactNode;
}

const TPButton = ({ 
  variant = 'primary', 
  children, 
  disabled = false, 
  onClick, 
  className = '',
  ...props 
}: TPButtonProps) => {
  const baseClass = 'tp-button';
  const variantClass = `tp-button--${variant}`;
  const disabledClass = disabled ? 'tp-button--disabled' : '';
  
  const buttonClass = `${baseClass} ${variantClass} ${disabledClass} ${className}`.trim();

  return (
    <button
      className={buttonClass}
      disabled={disabled}
      onClick={onClick}
      {...props}
    >
      {children}
    </button>
  );
};

export default TPButton;
