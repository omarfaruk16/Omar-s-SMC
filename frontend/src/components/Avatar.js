import React, { useState, useEffect } from 'react';

const Avatar = ({ image, name, size = 'md', className = '' }) => {
  const [imgError, setImgError] = useState(false);
  const [currentImage, setCurrentImage] = useState(image);

  useEffect(() => {
    setImgError(false);
    // Handle relative URLs
    if (image && (image.startsWith('/media') || image.startsWith('/static')) && !image.startsWith('http')) {
        // Assume backend is on port 8000 if not specified otherwise, 
        // or try to extract from env if available, but for now robustly handling the common case
        // Ideally this comes from a config
        const backendUrl = process.env.REACT_APP_BACKEND_URL || window.location.origin;
        setCurrentImage(`${backendUrl}${image}`);
    } else {
        setCurrentImage(image);
    }
  }, [image]);

  const sizeClasses = {
    xs: 'w-6 h-6 text-xs',
    sm: 'w-8 h-8 text-sm',
    md: 'w-10 h-10 text-base',
    lg: 'w-12 h-12 text-lg',
    xl: 'w-16 h-16 text-xl',
    '2xl': 'w-20 h-20 text-2xl',
    '3xl': 'w-24 h-24 text-3xl',
  };

  const getInitials = (name) => {
    if (!name) return '?';
    const names = name.trim().split(' ');
    if (names.length === 1) return names[0][0]?.toUpperCase() || '?';
    return (names[0][0] + names[names.length - 1][0]).toUpperCase();
  };

  const getColorFromName = (name) => {
    if (!name) return 'bg-gray-500';
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-purple-500',
      'bg-pink-500',
      'bg-indigo-500',
      'bg-red-500',
      'bg-yellow-500',
      'bg-teal-500',
      'bg-orange-500',
      'bg-cyan-500',
    ];
    const charCode = name.charCodeAt(0) + name.charCodeAt(name.length - 1);
    return colors[charCode % colors.length];
  };

  if (currentImage && !imgError) {
    return (
      <img
        src={currentImage}
        alt={name || 'Avatar'}
        className={`${sizeClasses[size]} rounded-full object-cover ${className}`}
        onError={() => setImgError(true)}
      />
    );
  }

  return (
    <div
      className={`${sizeClasses[size]} rounded-full flex items-center justify-center text-white font-semibold ${getColorFromName(name)} ${className}`}
    >
      {getInitials(name)}
    </div>
  );
};

export default Avatar;
