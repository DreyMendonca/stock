import React from 'react';
import { UseAdicionarProduto } from './UseAdicionarProduto';
import './AdicionarProduto.css';
import IconeEstoque from '../../icones/iconeEstoque.jpeg';
import IconeAdd from '../../icones/iconeAdd.jpeg';
import Logo from '../../images/logoSemFundo.png';

export const UseAdicionarProdutoView = () => {
    const {
        produto,
        imagem,
        categorias,
        novaCategoria,
        setNovaCategoria,
        mostrarCriarCategoria,
        setMostrarCriarCategoria,
        handleChange,
        handleImageChange,
        handleAddProduto,
        handleAdicionarCategoria
    } = UseAdicionarProduto();

    return (
        <div className="product-form-container">
            <aside className="sidebar">
                <a href='/' style={{ display: 'flex', justifyContent: 'center', marginBottom: '20px' }}>
                    <img src={Logo} style={{ width: '140%' }} />
                </a>

                <a href='/useAdicionarproduto' style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                    <img src={IconeEstoque} style={{ width: '60%' }} />
                </a>

                <a href='/estoque' style={{ display: 'flex', justifyContent: 'center', marginBottom: '30px' }}>
                    <img src={IconeAdd} style={{ width: '60%' }} />
                </a>
            </aside>

            <div className="form-section">
                <div className="form-header">
                    <h2>Adicionar Produto</h2>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Nome do Produto</label>
                            <input
                                type="text"
                                name="nome"
                                value={produto.nome}
                                onChange={handleChange}
                                placeholder="Nome do Produto"
                            />
                        </div>
                        <div className="form-group">
                            <label>Preço: R$</label>
                            <input
                                type="text"
                                name="preco"
                                value={produto.preco}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>Desconto: %</label>
                            <input
                                type="text"
                                name="desconto"
                                value={produto.desconto}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Quantidade</label>
                            <input
                                type="number"
                                name="quantidade"
                                value={produto.quantidade}
                                onChange={handleChange}
                            />
                        </div>
                    </div>
                    <div className="form-row">
                        <div className="form-group">
                            <label>SKU (Opcional)</label>
                            <input
                                type="text"
                                name="sku"
                                value={produto.sku}
                                onChange={handleChange}
                            />
                        </div>
                        <div className="form-group">
                            <label>Categoria</label>
                            <select
                                className='select-cat'
                                name="categoria"
                                value={produto.categoria}
                                onChange={handleChange}
                            >
                                <option value="">Selecione uma categoria</option>
                                {categorias.map((cat, index) => (
                                    <option key={index} value={cat}>{cat}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <div className='btn-group'>
                        <div className="upload-section">
                            <label htmlFor="file-upload" className="upload-label">Escolher Arquivo</label>
                            <input id="file-upload" type="file" onChange={handleImageChange} />
                        </div>
                        <div className='btn-header'>
                            <button
                                className="btn criar-categoria-btn"
                                onClick={() => setMostrarCriarCategoria(true)}
                            >
                                Criar nova categoria
                            </button>

                            {mostrarCriarCategoria && (
                                <div className="form-group nova-categoria">
                                    <label>Nova Categoria</label>
                                    <div className="nova-cat-row">
                                        <input
                                            type="text"
                                            value={novaCategoria}
                                            onChange={(e) => setNovaCategoria(e.target.value)}
                                            placeholder="Nome da nova categoria"
                                        />
                                        <button className="btn add-cat" onClick={handleAdicionarCategoria}>
                                            Adicionar
                                        </button>
                                    </div>
                                </div>
                            )}

                            <button className="btn add-product-btn" onClick={handleAddProduto}>
                                Adicionar Produto
                            </button>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default UseAdicionarProdutoView;
