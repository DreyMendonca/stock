import React, { useState } from 'react';
import { Sidebar, Menu, MenuItem } from 'react-pro-sidebar';
import { FaHome, FaBox, FaPlus, FaUser, FaSignOutAlt, FaSearch } from 'react-icons/fa';
import './Sidebar.css';
import logoFull from "../images/LogoEstocaAi.svg";
import logoMini from "../images/logoSide.png"; 

const MySidebar = ({ handleLogout }) => {
  const [collapsed, setCollapsed] = useState(true);

  return (
    <Sidebar
      collapsed={collapsed}
      onMouseEnter={() => setCollapsed(false)}
      onMouseLeave={() => setCollapsed(true)}
      className="sidebar-container"
    >
      <div className="sidebar-header">
        <img
          src={collapsed ? logoMini : logoFull}
          alt="Logo"
          className="sidebar-logo"
          style={{ width: collapsed ? "40px" : "120px", transition: "width 0.3s" }}
        />
      </div>

      <Menu iconShape="circle" className="sidebar-menu">
        <MenuItem icon={<FaHome />} className="pro-menu-item active">
          <a href="/home">Dashboard</a>
        </MenuItem>
        <MenuItem icon={<FaPlus />} className="pro-menu-item">
          <a href="/adicionarproduto">Adicionar Produto</a>
        </MenuItem>
        <MenuItem icon={<FaBox />} className="pro-menu-item">
          <a href="/estoque">Visualizar Estoque</a>
        </MenuItem>
        <MenuItem icon={<FaUser />} className="pro-menu-item">
          <a href="/cadastro-usuario">Funcionário</a>
        </MenuItem>
        <MenuItem icon={<FaSignOutAlt />} className="pro-menu-item">
          <span onClick={handleLogout} style={{ cursor: 'pointer' }}>Sair</span>
        </MenuItem>
      </Menu>
    </Sidebar>
  );
};

export default MySidebar;
