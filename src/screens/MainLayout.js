import React from 'react';
import { useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';
import MySidebar from './Sidebar';
import Header from './Header';

const MainLayout = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate('/Login');
    } catch (error) {
      console.error('Erro ao fazer logout:', error);
    }
  };

  return (
    <div style={{ display: 'flex', height: '100vh' }}>
      <MySidebar handleLogout={handleLogout} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        <Header />
        <main style={{ padding: '20px', overflowY: 'auto', marginTop: '80px' }}>
          {children}
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
