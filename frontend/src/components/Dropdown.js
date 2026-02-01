import React, { useEffect, useRef } from 'react';

const Dropdown = ({ isOpen, onClose, triggerRef, children, align = 'right', className = '' }) => {
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target) &&
        triggerRef?.current &&
        !triggerRef.current.contains(event.target)
      ) {
        onClose();
      }
    };

    const handleEscape = (event) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleEscape);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, triggerRef]);

  if (!isOpen) return null;

  const alignmentClasses = align === 'left' ? 'left-0' : 'right-0';

  return (
    <div
      ref={dropdownRef}
      className={`absolute ${alignmentClasses} mt-2 w-64 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 ${className}`}
    >
      {children}
    </div>
  );
};

export default Dropdown;
