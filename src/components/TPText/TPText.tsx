import React from 'react';

interface TPTextProps {
  variant?: 'h1-regular' | 'h1-semibold' | 'h2-regular' | 'h2-semibold' | 'h3-regular' | 'h3-semibold' | 'body-regular' | 'body-semibold' | 'caption' | 'title-semibold';
  color?: string;
  children: React.ReactNode;
  className?: string;
  as?: keyof JSX.IntrinsicElements;
  [key: string]: any;
}

const TPText = ({ 
  variant = 'body-regular', 
  color, 
  children, 
  className = '',
  as: Component = 'span',
  ...props 
}: TPTextProps) => {
  const textClass = `tp-${variant} ${className}`.trim();
  
  const style = color ? { color } : {};

  return (
    <Component 
      className={textClass} 
      style={style}
      {...props}
    >
      {children}
    </Component>
  );
};

export default TPText;
