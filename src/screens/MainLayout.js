// components/MainLayout.jsx
import React from 'react';
import MySidebar from './Sidebar';

const MainLayout = ({ children }) => {
  return (
    <div style={{ display: 'flex' }}>
      <MySidebar />
      <main style={{ marginLeft: '80px', padding: '20px', width: '100%' }}>
        {children}
      </main>
    </div>
  );
};

export default MainLayout;
