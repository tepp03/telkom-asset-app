import React from 'react';

// color: background color for avatar circle
export const AvatarButton = ({ icon, ariaLabel, onClick, href, color = '#fff' }) => {
  const content = (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 48,
        height: 48,
        borderRadius: '50%',
        background: color,
        boxShadow: '0 2px 8px rgba(0,0,0,0.10)',
      }}
    >
      {icon}
    </span>
  );
  if (href) {
    return (
      <a
        className="avatar-btn"
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        aria-label={ariaLabel}
        style={{ border: 'none', background: 'none', padding: 0, margin: '0 8px', cursor: 'pointer', display: 'inline-block' }}
      >
        {content}
      </a>
    );
  }
  return (
    <button
      className="avatar-btn"
      onClick={onClick}
      aria-label={ariaLabel}
      style={{ border: 'none', background: 'none', padding: 0, margin: '0 8px', cursor: 'pointer' }}
      tabIndex={0}
    >
      {content}
    </button>
  );
};

export default AvatarButton;
