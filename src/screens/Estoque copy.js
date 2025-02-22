import React, { useState, useEffect } from 'react';
import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Estoque.css';
import qrCodeImage from '../images/image-QR-Code-pagamento.png';

export const Estoque = () => {
    const [produtos, setProdutos] = useState([]);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantidades, setQuantidades] = useState({});
    const [totalPrice, setTotalPrice] = useState(0);
    const [showQRCode, setShowQRCode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null); // Estado para controle de edição
    const [editedProductData, setEditedProductData] = useState({}); // Dados do produto sendo editado
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchProdutos(currentUser.uid);
            } else {
                navigate('/login');
            }
        });

        return () => unsubscribe();
    }, [navigate]);

    const fetchProdutos = async (userId) => {
        try {
            const querySnapshot = await getDocs(collection(db, 'produtos'));
            const produtosArray = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            })).filter(produto => produto.userId === userId);

            setProdutos(produtosArray);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        }
    };

    const handleQuantityChange = (id, quantidade) => {
        const produto = produtos.find(p => p.id === id);
        const estoqueDisponivel = produto?.quantidade || 0;

        if (quantidade === "") {
            setErrorMessage('');
            setQuantidades(prevState => ({
                ...prevState,
                [id]: ""
            }));
        } else {
            const parsedQuantity = parseInt(quantidade, 10);

            if (isNaN(parsedQuantity) || parsedQuantity < 1) {
                setErrorMessage('A quantidade mínima é 1.');
            } else if (parsedQuantity > estoqueDisponivel) {
                setErrorMessage(`Máximo de ${estoqueDisponivel} produtos disponíveis.`);
            } else {
                setErrorMessage('');
                setQuantidades(prevState => ({
                    ...prevState,
                    [id]: parsedQuantity
                }));
            }
        }
    };

    const handleCalcular = () => {
        let total = 0;

        // Verificar o valor de quantidades e precos
        produtos.forEach(produto => {
            const quantidade = parseInt(quantidades[produto.id] || 0, 10);

            if (quantidade > 0) {
                const precoProduto = parseFloat(produto.preco) || 0; // Garantir que o preço seja um número
                total += (quantidade * precoProduto);
            }
        });

        // Verificando o valor total
        console.log('Total calculado:', total);

        setTotalPrice(total);
    };


    const handleFinalizarCompra = async () => {
        setIsLoading(true);
        setTimeout(async () => {
            setIsLoading(false);
            setShowQRCode(true);

            // Registrar as vendas no histórico
            for (const produtoId in quantidades) {
                const quantidadeVenda = quantidades[produtoId];
                if (quantidadeVenda > 0) {
                    const produto = produtos.find(p => p.id === produtoId);
                    if (produto) {
                        const novoEstoque = produto.quantidade - quantidadeVenda;

                        // Atualiza o estoque no Firestore
                        const produtoRef = doc(db, 'produtos', produtoId);
                        await updateDoc(produtoRef, {
                            quantidade: novoEstoque
                        });

                        // Registra a venda no histórico de vendas
                        await addDoc(collection(db, 'historico_vendas'), {
                            nomeProduto: produto.nome,
                            quantidadeVendida: quantidadeVenda,
                            usuario: user?.displayName || 'Nome não disponível',
                            data: new Date(),
                        });
                    }
                }
            }
            setPaymentCompleted(false);
        }, 3000);
    };



    // const handlePaymentCompleted = async () => {
    //     for (const produtoId in quantidades) {
    //         const quantidadeVenda = quantidades[produtoId];
    //         if (quantidadeVenda > 0) {
    //             const produto = produtos.find(p => p.id === produtoId);
    //             if (produto) {
    //                 const novoEstoque = produto.quantidade - quantidadeVenda;
    //                 const produtoRef = doc(db, 'produtos', produtoId);
    //                 await updateDoc(produtoRef, {
    //                     quantidade: novoEstoque
    //                 });
    //             }
    //         }
    //     }
    //     setPaymentCompleted(true);
    // };

    const handleConfirmarPagamento = async () => {
        setIsLoading(true);
        try {
            const vendas = [];

            for (const produto of produtos) {
                const quantidadeVendida = quantidades[produto.id] || 0;

                if (quantidadeVendida > 0) {
                    // Desconta a quantidade do estoque
                    const novoEstoque = produto.quantidade - quantidadeVendida;
                    const produtoRef = doc(db, 'produtos', produto.id);

                    await updateDoc(produtoRef, { quantidade: novoEstoque });

                    // Salva a venda no histórico de vendas
                    await addDoc(collection(db, 'historicoVendas'), {
                        produtoId: produto.id,
                        nome: produto.nome,
                        quantidadeVendida,
                        dataVenda: new Date(),
                        userId: user.uid
                    });

                    // Adiciona a venda para feedback visual (opcional)
                    vendas.push({
                        produtoId: produto.id,
                        nome: produto.nome,
                        quantidadeVendida,
                        dataVenda: new Date()
                    });
                }
            }

            setPaymentCompleted(true);
            setIsLoading(false);
            setQuantidades({}); // Reseta as quantidades após a venda
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            setIsLoading(false);
        }
    };


    const handleEditClick = (produto) => {
        setEditingProductId(produto.id);
        setEditedProductData({
            nome: produto.nome,
            categoria: produto.categoria,
            preco: produto.preco,
            quantidade: produto.quantidade
        });
    };

    const handleCancelEdit = () => {
        setEditingProductId(null);
        setEditedProductData({});
    };

    const handleSaveEdit = async () => {
        const produtoRef = doc(db, 'produtos', editingProductId);
        await updateDoc(produtoRef, {
            nome: editedProductData.nome,
            categoria: editedProductData.categoria,
            preco: editedProductData.preco,
            quantidade: editedProductData.quantidade
        });
        setEditingProductId(null);
        setEditedProductData({});
        fetchProdutos(user.uid); // Recarregar a lista de produtos
    };

    const filteredProdutos = produtos.filter(produto =>
        produto.nome.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!user) {
        return null;
    }

    return (
        <div className="estoque-container">
            <h1>Estoque</h1>
            <input
                type="text"
                placeholder="Pesquisar produto..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
            />
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
                    {filteredProdutos.map((produto, index) => (
                        <tr key={produto.id}>
                            <td>
                                {produto.imagem && <img style={{ width: '120px' }} src={produto.imagem} alt={produto.nome} className="product-image" />}
                            </td>
                            <td>{index + 1}</td>
                            <td className="product-name">{produto.nome}</td>
                            <td>{produto.categoria}</td>
                            <td>{produto.preco}</td>
                            <td>{produto.quantidade}</td>
                            <td>
                                <input
                                    type="number"
                                    min="1"
                                    max={produto.quantidade}
                                    value={quantidades[produto.id] || ''}
                                    onChange={(e) => handleQuantityChange(produto.id, e.target.value)}
                                    className="quantity-input"
                                />
                            </td>
                            <td>
                                <button onClick={() => handleEditClick(produto)} className="edit-button">
                                    <i className="fa fa-pencil"></i> Editar
                                </button>
                            </td>
                        </tr>
                    ))}
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
                        <img src={qrCodeImage} alt="QR Code para pagamento" />
                        <br />
                        {/* <button style={{ textAlign: 'center', width: '100%', marginTop: '10px' }} onClick={handlePaymentCompleted}>Confirmar Pagamento</button> */}
                        <button style={{ textAlign: 'center', width: '100%', marginTop: '10px' }} onClick={handleConfirmarPagamento} disabled={isLoading}>
                            Confirmar Pagamento 02
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

export default Estoque;