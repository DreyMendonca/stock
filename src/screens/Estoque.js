import React, { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from '../firebase'; // Certifique-se de importar
import { db, auth } from '../firebase';
import { collection, getDocs, updateDoc, doc, addDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';
import './Estoque.css';
import qrCodeImage from '../images/imagem-pagamento.jpeg';
import { deleteDoc } from 'firebase/firestore'; // Importe o deleteDoc
import IconeEstoque from '../icones/iconeEstoque.jpeg';
import IconeAdd from '../icones/iconeAdd.jpeg';
import Logo from '../images/logoSemFundo.png';


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
    const [editingProductId, setEditingProductId] = useState(null);
    const [editedProductData, setEditedProductData] = useState({});
    const [imagem, setImagem] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [selectedCategoria, setSelectedCategoria] = useState('');  // Alterado para selectedCategoria
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
                fetchProdutos(currentUser.uid);
            }
        });
        return () => unsubscribe();
    }, []);

    useEffect(() => {
        const fetchCategorias = async () => {
            if (!user) return;
            try {
                const snapshot = await getDocs(collection(db, 'categorias'));
                const categoriasFiltradas = snapshot.docs
                    .filter((doc) => doc.data().userId === user.uid)
                    .map((doc) => doc.data().nome);
                setCategorias(categoriasFiltradas);
            } catch (error) {
                console.error('Erro ao buscar categorias:', error);
            }
        };
        fetchCategorias();
    }, [user]);

    const fetchProdutos = async (userId) => {
        try {
            const querySnapshot = await getDocs(collection(db, 'produtos'));
            const produtosArray = querySnapshot.docs
                .map((doc) => ({ id: doc.id, ...doc.data() }))
                .filter((produto) => produto.userId === userId);
            setProdutos(produtosArray);
        } catch (error) {
            console.error('Erro ao buscar produtos:', error);
        }
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) setImagem(file);
    };

    const handleQuantityChange = (id, quantidade) => {
        const produto = produtos.find((p) => p.id === id);
        const estoqueDisponivel = produto?.quantidade || 0;

        if (quantidade === "") {
            setErrorMessage('');
            setQuantidades((prev) => ({ ...prev, [id]: "" }));
        } else {
            const parsedQuantity = parseInt(quantidade, 10);
            if (isNaN(parsedQuantity) || parsedQuantity < 1) {
                setErrorMessage('A quantidade mínima é 1.');
            } else if (parsedQuantity > estoqueDisponivel) {
                setErrorMessage(`Máximo de ${estoqueDisponivel} produtos disponíveis.`);
            } else {
                setErrorMessage('');
                setQuantidades((prev) => ({ ...prev, [id]: parsedQuantity }));
            }
        }
    };

    const handleCalcular = () => {
        let total = 0;
        produtos.forEach((produto) => {
            const quantidade = parseInt(quantidades[produto.id] || 0, 10);
            if (quantidade > 0) {
                const preco = parseFloat(produto.preco) || 0;
                total += quantidade * preco;
            }
        });
        setTotalPrice(total);
    };

    const handleFinalizarCompra = async () => {
        setIsLoading(true);
        setTimeout(async () => {
            setIsLoading(false);
            setShowQRCode(true);

            for (const produtoId in quantidades) {
                const quantidadeVenda = quantidades[produtoId];
                if (quantidadeVenda > 0) {
                    const produto = produtos.find((p) => p.id === produtoId);
                    if (produto) {
                        const novoEstoque = produto.quantidade - quantidadeVenda;
                        const produtoRef = doc(db, 'produtos', produtoId);
                        await updateDoc(produtoRef, { quantidade: novoEstoque });

                        await addDoc(collection(db, 'historico_vendas'), {
                            nomeProduto: produto.nome,
                            quantidadeVendida: quantidadeVenda,
                            usuario: user?.displayName || 'Desconhecido',
                            data: new Date(),
                        });
                    }
                }
            }

            setPaymentCompleted(false);
        }, 3000);
    };

    const handleConfirmarPagamento = async () => {
        setIsLoading(true);
        try {
            for (const produto of produtos) {
                const quantidadeVendida = quantidades[produto.id] || 0;
                if (quantidadeVendida > 0) {
                    const novoEstoque = produto.quantidade - quantidadeVendida;
                    const produtoRef = doc(db, 'produtos', produto.id);
                    await updateDoc(produtoRef, { quantidade: novoEstoque });

                    await addDoc(collection(db, 'historicoVendas'), {
                        produtoId: produto.id,
                        nome: produto.nome,
                        quantidadeVendida,
                        dataVenda: new Date(),
                        userId: user.uid,
                    });
                }
            }

            setPaymentCompleted(true);
            setIsLoading(false);
            setQuantidades({});
        } catch (error) {
            console.error('Erro ao confirmar pagamento:', error);
            setIsLoading(false);
        }
    };

    const handleDelete = async (produtoId) => {
        if (window.confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await deleteDoc(doc(db, 'produtos', produtoId));
                setProdutos((prev) => prev.filter((p) => p.id !== produtoId));
                alert('Produto excluído com sucesso!');
            } catch (error) {
                console.error('Erro ao excluir produto:', error);
                alert('Erro ao excluir o produto.');
            }
        }
    };

    const handleEditClick = (produto) => {
        setEditingProductId(produto.id);
        setEditedProductData({
            nome: produto.nome,
            categoria: produto.categoria,
            preco: produto.preco,
            quantidade: produto.quantidade,
            desconto: produto.desconto,
            imagem: produto.imagem || ''
        });
    };

    const handleCancelEdit = () => {
        setEditingProductId(null);
        setEditedProductData({});
    };

    const handleSaveEdit = async () => {
        try {
            const novaImagemUrl = imagem ? await uploadImagem() : editedProductData.imagem;

            if (!novaImagemUrl) throw new Error('A imagem do produto é obrigatória.');

            const produtoRef = doc(db, 'produtos', editingProductId);
            await updateDoc(produtoRef, {
                ...editedProductData,
                imagem: novaImagemUrl
            });

            setEditingProductId(null);
            setEditedProductData({});
            setImagem(null);
            fetchProdutos(user.uid);
        } catch (error) {
            console.error('Erro ao salvar edição:', error);
            alert('Erro ao salvar as alterações do produto.');
        }
    };

    const uploadImagem = async () => {
        const imagemRef = ref(storage, `produtos/${imagem.name}`);
        const snapshot = await uploadBytes(imagemRef, imagem);
        return getDownloadURL(snapshot.ref);
    };

    const filteredProdutos = produtos.filter((produto) => {
        const nomeMatch = produto.nome.toLowerCase().includes(searchTerm.toLowerCase());
        const categoriaMatch = selectedCategoria ? produto.categoria === selectedCategoria : true;
        return nomeMatch && categoriaMatch;
    });

    const handleCategoriaChange = (e) => {
        setSelectedCategoria(e.target.value);  // Alterado para setSelectedCategoria
    };

    if (!user) return null;


    return (
        <div className="estoque-container">
            <aside className="sidebar">
                <a href='/'>                <img src={Logo} style={{ width: '140%' }} /></a>
                <a href='/adicionarproduto' style={{ display: 'absolute', justifyContent: 'center', marginBottom: '30px' }}>                <img src={IconeEstoque} style={{ width: '60%' }} /></a>
                <a href='/estoque' style={{ display: 'absolute', justifyContent: 'center', marginBottom: '30px' }}>                <img src={IconeAdd} style={{ width: '60%' }} /></a>
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
                    {filteredProdutos.map((produto) => {
                        const isEstoqueBaixo = produto.quantidade < 30;

                        return (
                            <tr
                                key={produto.id}
                                className={isEstoqueBaixo ? 'estoque-baixo' : ''}
                            >
                                <td><img src={produto.imagem} alt="Produto" style={{ width: '50px' }} /></td>
                                <td>{produto.id}</td>
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
                                    <button onClick={() => handleEditClick(produto)}>Editar</button>
                                    <button onClick={() => handleDelete(produto.id)}>Excluir</button>
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
                        {/* <button style={{ textAlign: 'center', width: '100%', marginTop: '10px' }} onClick={handlePaymentCompleted}>Confirmar Pagamento</button> */}
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

export default Estoque;
