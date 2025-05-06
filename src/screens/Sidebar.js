import React, { useState } from 'react';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { FaHome, FaBox, FaPlus, FaUser, FaSignOutAlt, FaBars } from 'react-icons/fa';
import './Sidebar.css';
import logoFull from "../images/LogoEstocaAi.svg";
import logoMini from "../images/logoSide.png";

const MySidebar = ({ handleLogout }) => {
  const [collapsed, setCollapsed] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const toggleMobileSidebar = () => {
    setIsMobileOpen(!isMobileOpen);
  };

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
          <MenuItem icon={<FaUser />} component={<a href="/cadastro-usuario" />}>Funcionário</MenuItem>
          <MenuItem icon={<FaSignOutAlt />} onClick={handleLogout}>Sair</MenuItem>
        </Menu>
      </Sidebar>
    </>
  );
};

export default MySidebar;
