import React from 'react';

interface CardProps {
  icon?: string;
  title?: string;
  description?: string;
  children?: React.ReactNode;
  className?: string;
  hover?: boolean;
}

export const Card: React.FC<CardProps> = ({
  icon,
  title,
  description,
  children,
  className = '',
  hover = true,
}) => {
  return (
    <div className={`card ${hover ? '' : 'hover:border-current hover:shadow-none'} ${className}`}>
      {icon && <div className="card-icon">{icon}</div>}
      {title && <h3 className="card-title">{title}</h3>}
      {description && <p className="card-description">{description}</p>}
      {children}
    </div>
  );
};

