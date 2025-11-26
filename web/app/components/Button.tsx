'use client';

import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  onClick?: () => void;
  href?: string;
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
}

export const Button: React.FC<ButtonProps> = ({
  children,
  onClick,
  href,
  className = '',
  variant = 'primary',
  size = 'md',
  disabled = false,
  type = 'button',
}) => {
  const baseClasses = 'btn';
  const variantClasses = `btn-${variant}`;
  const sizeClasses = `btn-${size}`;
  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : '';

  const combinedClassName = `${baseClasses} ${variantClasses} ${sizeClasses} ${disabledClasses} ${className}`;

  if (href) {
    return (
      <Link href={href} className={combinedClassName}>
        {children}
      </Link>
    );
  }

  return (
    <button
      type={type}
      onClick={onClick}
      className={combinedClassName}
      disabled={disabled}
    >
      {children}
    </button>
  );
};

