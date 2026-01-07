import React from 'react';

interface SectionProps {
  title?: string;
  subtitle?: string;
  children: React.ReactNode;
  className?: string;
  background?: 'primary' | 'secondary';
  id?: string;
}

export const Section: React.FC<SectionProps> = ({
  title,
  subtitle,
  children,
  className = '',
  background = 'primary',
  id,
}) => {
  const bgClass = background === 'secondary' ? 'bg-[#1A1A2E]' : '';

  return (
    <section id={id} className={`section ${bgClass} ${className}`}>
      <div className="section-inner">
        {(title || subtitle) && (
          <div className="text-center mb-lg">
            {title && <h2>{title}</h2>}
            {subtitle && <p className="text-secondary text-lg">{subtitle}</p>}
          </div>
        )}
        {children}
      </div>
    </section>
  );
};

