import React from 'react';
import { Estoque } from './Estoque';
import './Estoque.css';
import Logo from '../../images/logoSemFundo.png';
import IconeEstoque from '../../icones/iconeEstoque.jpeg';
import IconeAdd from '../../icones/iconeAdd.jpeg';

export const EstoqueView = () => {
    const {
        produtos,
        searchTerm,
        setSearchTerm,
        categorias,
        selectedCategoria,
        handleCategoriaChange,
        filteredProdutos = [],
        quantidades,
        handleQuantityChange,
        handleEditClick,
        handleDelete,
        editingProductId,
        editedProductData,
        setEditedProductData,
        handleImageChange,
        handleSaveEdit,
        handleCancelEdit,
        errorMessage,
        handleCalcular,
        totalPrice,
        handleFinalizarCompra,
        isLoading,
        showQRCode,
        paymentCompleted,
        qrCodeImage,
        handleConfirmarPagamento
    } = Estoque();

    return (
        <div className="estoque-container">
            <aside className="sidebar">
                <a href='/'>
                    <img src={Logo} style={{ width: '140%' }} alt="Logo" />
                </a>
                <a href='/adicionarproduto' style={{ display: 'absolute', justifyContent: 'center', marginBottom: '30px' }}>
                    <img src={IconeEstoque} style={{ width: '60%' }} alt="Ícone Estoque" />
                </a>
                <a href='/estoque' style={{ display: 'absolute', justifyContent: 'center', marginBottom: '30px' }}>
                    <img src={IconeAdd} style={{ width: '60%' }} alt="Ícone Adicionar" />
                </a>
            </aside>
            <h1>Estoque</h1>
            <input
                type="text"
                placeholder="Pesquisar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
            <div className="filtro-categoria">
                <label>Filtrar por Categoria:</label>
                <select
                    value={selectedCategoria}
                    onChange={handleCategoriaChange}
                >
                    <option value="">Todas</option>
                    {categorias.map((categoria, index) => (
                        <option key={index} value={categoria}>{categoria}</option>
                    ))}
                </select>
            </div>

            <table className="product-table">
                <thead>
                    <tr>
                        <th>Imagem</th>
                        <th>ID</th>
                        <th>Nome do Produto</th>
                        <th>Categoria</th>
                        <th>Preço</th>
                        <th>Estoque</th>
                        <th>Quantidade Para Venda</th>
                        <th>Ações</th>
                    </tr>
                </thead>
                <tbody>
                {filteredProdutos && filteredProdutos.map((produto, index) => {
                        const isEstoqueBaixo = produto.quantidade < 30;

                        return (
                            <tr
                                key={produto.id}
                                className={isEstoqueBaixo ? 'estoque-baixo' : ''}
                            >
                                <td>
                                    {produto.imagem && <img style={{ width: '120px' }} src={produto.imagem} alt={produto.nome} className="product-image" />}
                                </td>
                                <td>{index + 1}</td>
                                <td>{produto.nome}</td>
                                <td>{produto.categoria}</td>
                                <td>R$ {parseFloat(produto.preco).toFixed(2)}</td>
                                <td>
                                    {produto.quantidade}
                                    {isEstoqueBaixo && (
                                        <span className="aviso-estoque"> 🔴 Baixo estoque</span>
                                    )}
                                </td>
                                <td>
                                    <input
                                        type="number"
                                        value={quantidades[produto.id] || ''}
                                        onChange={(e) => handleQuantityChange(produto.id, e.target.value)}
                                        min="1"
                                    />
                                </td>
                                <td>
                                    <button onClick={() => handleEditClick(produto)} className="edit-button">
                                        <i className="fa fa-pencil"></i> Editar
                                    </button>
                                    <button onClick={() => handleDelete(produto.id)} className="delete-button">
                                        <i className="fa fa-trash"></i> Excluir
                                    </button>
                                </td>
                            </tr>
                        );
                    })}
                </tbody>
            </table>

            {editingProductId && (
                <div className="edit-form">
                    <h3>Editar Produto</h3>
                    <label>
                        Nome:
                        <input
                            type="text"
                            value={editedProductData.nome}
                            onChange={(e) => setEditedProductData({ ...editedProductData, nome: e.target.value })}
                        />
                    </label>
                    <label>
                        Categoria:
                        <input
                            type="text"
                            value={editedProductData.categoria}
                            onChange={(e) => setEditedProductData({ ...editedProductData, categoria: e.target.value })}
                        />
                    </label>
                    <label>
                        Preço:
                        <input
                            type="number"
                            value={editedProductData.preco}
                            onChange={(e) => setEditedProductData({ ...editedProductData, preco: e.target.value })}
                        />
                    </label>
                    <label>
                        Quantidade:
                        <input
                            type="number"
                            value={editedProductData.quantidade}
                            onChange={(e) => setEditedProductData({ ...editedProductData, quantidade: e.target.value })}
                        />
                        Desconto %  :
                        <input
                            type="number"
                            value={editedProductData.desconto}
                            onChange={(e) => setEditedProductData({ ...editedProductData, desconto: e.target.value })}
                        />
                        Imagem :
                        <input
                            type="file"
                            onChange={handleImageChange}
                        />
                    </label>
                    <div>
                        <button onClick={handleSaveEdit}>Salvar</button>
                        <button onClick={handleCancelEdit}>Cancelar</button>
                    </div>
                </div>
            )}

            {errorMessage && <p className="error-message">{errorMessage}</p>}

            <div>
                <button onClick={handleCalcular} className="finalize-button">
                    Calcular Total
                </button>
                {totalPrice > 0 && (
                    <>
                        <h2>Preço Total: R${totalPrice.toFixed(2)}</h2>
                        <button onClick={handleFinalizarCompra} className="finalize-button">
                            Concluir Pagamento
                        </button>
                    </>
                )}
            </div>

            {isLoading && (
                <div className="loading-overlay">
                    <div className="loading-spinner"></div>
                </div>
            )}

            {showQRCode && !paymentCompleted && (
                <div className="qr-code-container">
                    <div>
                        <p>Escaneie o código para pagar</p>
                        <img src={qrCodeImage} alt="QR Code para pagamento" width={300} />
                        <br />
                        <button style={{ textAlign: 'center', width: '100%', marginTop: '10px' }} onClick={handleConfirmarPagamento} disabled={isLoading}>
                            Confirmar Pagamento
                        </button>
                    </div>
                </div>
            )}

            {paymentCompleted && (
                <div className="payment-success">
                    <p>Pagamento concluído! Seus produtos foram vendidos.</p>
                </div>
            )}
        </div>
    );
};
export default EstoqueView;