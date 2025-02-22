import React from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import Home from './screens/Home';
import AdicionarProduto from './screens/AdicionarProduto';
import Cadastro from './screens/Cadastro';
import Login from './screens/Login';
import Estoque from './screens/Estoque';

function App() {
  return (
    <>
      <Router>
        <Routes>
          {/* Redireciona '/' para '/Login' */}
          <Route path="/" element={<Navigate to="/Login" />} />
          <Route path="/home" element={<Home />} />
          <Route path="/AdicionarProduto" element={<AdicionarProduto />} />
          <Route path="/Cadastro" element={<Cadastro />} />
          <Route path="/Login" element={<Login />} />
          <Route path="/Estoque" element={<Estoque />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;
