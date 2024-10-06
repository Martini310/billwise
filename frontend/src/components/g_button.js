import React from 'react';

const GoogleSignInButton = ({ onClick }) => {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        padding: '20px',
      }}
    >
        <img
        src="/assets/g_button.png"
        alt="Sign in with Google"
        style={{
            cursor: 'pointer',
            height: 'auto',
        }}
        onClick={onClick}
        />
    </div>
  );
};

export default GoogleSignInButton;