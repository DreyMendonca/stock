import React, { useEffect, useState } from 'react';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { FaHome, FaBox, FaPlus, FaUser, FaSignOutAlt, FaBars } from 'react-icons/fa';
import './Sidebar.css';
import logoFull from "../images/LogoEstocaAi.svg";
import logoMini from "../images/logoSide.png";
import { auth, db } from '../firebase';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore';

const MySidebar = ({ handleLogout }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

  const [status, setStatus] = useState({
    loading: true,
    isAdmin: false,
    error: null
  });

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        console.log('UID do Auth:', user.uid);

        try {
          const querySnapshot = await getDocs(
            query(collection(db, 'usuarios'),
              where('uid', '==', user.uid))
          );

          if (!querySnapshot.empty) {
            const userData = querySnapshot.docs[0].data();
            console.log('Dados encontrados:', userData);
            setStatus({
              loading: false,
              isAdmin: userData.role === 'admin',
              error: null
            });
          } else {
            console.log('Nenhum documento com este UID');
            setStatus({
              loading: false,
              isAdmin: false,
              error: 'Usuário não encontrado no banco de dados'
            });
          }
        } catch (error) {
          console.error('Erro ao buscar usuário:', error);
          setStatus({
            loading: false,
            isAdmin: false,
            error: error.message
          });
        }
      } else {
        setStatus({
          loading: false,
          isAdmin: false,
          error: 'Nenhum usuário autenticado'
        });
      }
    });

    return () => unsubscribe();
  }, []);

  return (
    <>
      {/* Botão hambúrguer para dispositivos móveis */}
      <button className="hamburger-btn" onClick={toggleMobileSidebar}>
        <FaBars />
      </button>

      <Sidebar
        collapsed={collapsed}
        onMouseEnter={() => setCollapsed(false)}
        onMouseLeave={() => setCollapsed(true)}
        className={`sidebar-container ${isMobileOpen ? 'open' : ''}`}
      >

        <div className="sidebar-header">
          <button className="hamburger-btn" onClick={toggleMobileSidebar}>
            <FaBars />
          </button>
          <img
            src={collapsed ? logoMini : logoFull}
            alt="Logo"
            className="sidebar-logo"
            style={{ width: collapsed ? "40px" : "120px", transition: "width 0.3s" }}
          />
        </div>

        <Menu iconShape="circle" className="sidebar-menu">
          <MenuItem icon={<FaHome />} component={<a href="/home" />}>Dashboard</MenuItem>
          <MenuItem icon={<FaPlus />} component={<a href="/adicionarproduto" />}>Adicionar Produto</MenuItem>
          <MenuItem icon={<FaBox />} component={<a href="/estoque" />}>Visualizar Estoque</MenuItem>

          {!status.loading && status.isAdmin && (
            <MenuItem icon={<FaUser />} component={<a href="/cadastro-usuario" />}>
              Funcionário
            </MenuItem>
          )}

          <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>Sair</MenuItem>
        </Menu>
      </Sidebar>
    </>
  );
};

export default MySidebar;
