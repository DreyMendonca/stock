import React, { useEffect, useState } from 'react';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { FaHome, FaBox, FaPlus, FaUser, FaSignOutAlt, FaBars } from 'react-icons/fa';
import './Sidebar.css';
import logoFull from "../images/LogoEstocaAi.svg";
import logoMini from "../images/logoSide.png";
import { auth, db } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';

const MySidebar = ({ handleLogout }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [windowWidth, setWindowWidth] = useState(window.innerWidth);
  const [status, setStatus] = useState({
    loading: true,
    isAdmin: false,
    error: null,
  });

  useEffect(() => {
    const handleResize = () => setWindowWidth(window.innerWidth);
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        try {
          const querySnapshot = await getDocs(
            query(collection(db, 'usuarios'), where('uid', '==', user.uid))
          );
          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            setStatus({ loading: false, isAdmin: userData.role === 'admin', error: null });
          } else {
            setStatus({ loading: false, isAdmin: false, error: 'Usuário não encontrado' });
          }
        } catch (error) {
          setStatus({ loading: false, isAdmin: false, error: error.message });
        }
      } else {
        setStatus({ loading: false, isAdmin: false, error: 'Nenhum usuário autenticado' });
      }
    });

    return () => unsubscribe();
  }, []);

  const isDesktop = windowWidth >= 600;

  return (
    <>
      {/* Botão hambúrguer sempre visível em mobile */}
      {!isDesktop && (
        <button className="hamburger-btn" onClick={() => setIsMobileOpen(!isMobileOpen)}>
          <FaBars />
        </button>
      )}

      {isDesktop ? (
        <Sidebar
          backgroundColor="#ffffff"
          collapsed={collapsed}
          onMouseEnter={() => setCollapsed(false)}
          onMouseLeave={() => setCollapsed(true)}
          className={`sidebar-container ${collapsed ? 'collapsed' : 'expanded'}`}
        >
          <div className="sidebar-header">
            <img
              src={collapsed ? logoMini : logoFull}
              alt="Logo"
              className="sidebar-logo"
              style={{ width: collapsed ? '40px' : '120px' }}
            />
          </div>

          <Menu iconShape="circle" className="sidebar-menu sidebar__menu">
            <MenuItem icon={<FaHome />} component={<a href="/home" />}>Dashboard</MenuItem>
            <MenuItem icon={<FaPlus />} component={<a href="/adicionarproduto" />}>Adicionar Produto</MenuItem>
            <MenuItem icon={<FaBox />} component={<a href="/estoque" />}>Visualizar Estoque</MenuItem>
            {!status.loading && status.isAdmin && (
              <MenuItem icon={<FaUser />} component={<a href="/cadastro-usuario" />}>Funcionário</MenuItem>
            )}
            <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>Sair</MenuItem>
          </Menu>
        </Sidebar>
      ) : (
        <div className={`sidebar-container-mobile ${isMobileOpen ? 'open' : ''}`}>
          <Menu iconShape="circle" className="sidebar-menu">
            <MenuItem icon={<FaHome />} component={<a href="/home" />}>Dashboard</MenuItem>
            <MenuItem icon={<FaPlus />} component={<a href="/adicionarproduto" />}>Adicionar Produto</MenuItem>
            <MenuItem icon={<FaBox />} component={<a href="/estoque" />}>Visualizar Estoque</MenuItem>
            {!status.loading && status.isAdmin && (
              <MenuItem icon={<FaUser />} component={<a href="/cadastro-usuario" />}>Funcionário</MenuItem>
            )}
            <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>Sair</MenuItem>
          </Menu>
        </div>
      )}
    </>
  );
};

export default MySidebar;
