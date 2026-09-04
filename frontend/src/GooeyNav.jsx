import React, { useState, useEffect } from 'react';
import './GooeyNav.css';

const GooeyNav = ({
  items = [],
  initialActiveIndex = 0,
  className = ''
}) => {
  const [activeIndex, setActiveIndex] = useState(initialActiveIndex);

  useEffect(() => {
    if (initialActiveIndex !== undefined && initialActiveIndex !== activeIndex) {
      setActiveIndex(initialActiveIndex);
    }
  }, [initialActiveIndex]);

  const handleClick = (e, item, index) => {
    if (item.onClick) {
      item.onClick(e);
    }
    setActiveIndex(index);
  };

  return (
    <nav className={`simple-nav-bar ${className}`.trim()} aria-label="Main Navigation">
      <ul className="simple-nav-list">
        {items.map((item, index) => {
          const isActive = activeIndex === index;
          return (
            <li
              key={index}
              className={`simple-nav-item ${isActive ? 'active' : ''}`}
            >
              <a
                href={item.href || '#'}
                onClick={e => handleClick(e, item, index)}
              >
                {item.label}
              </a>
            </li>
          );
        })}
      </ul>
    </nav>
  );
};

export default GooeyNav;
