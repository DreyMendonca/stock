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
import LogoSide from '../images/logoSide.png';
import EstoqueSide from '../images/estoque.png';
import AddSide from '../images/botao-adicionar.png';
import FuncionarioSide from '../images/equipe.png';
import Logout from '../images/logout.png';

export const Estoque = () => {
    const [produtos, setProdutos] = useState([]);
    const [user, setUser] = useState(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [quantidades, setQuantidades] = useState({});
    const [totalPrice, setTotalPrice] = useState(0);
    const [totalDesconto, setTotalDesconto] = useState(0);
    const [showQRCode, setShowQRCode] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [paymentCompleted, setPaymentCompleted] = useState(false);
    const [editingProductId, setEditingProductId] = useState(null);
    const [editedProductData, setEditedProductData] = useState({});
    const [imagem, setImagem] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [selectedCategoria, setSelectedCategoria] = useState('');  // Alterado para selectedCategoria
    const [tipoFiltro, setTipoFiltro] = useState('maisProxima'); // 'maisProxima' é o valor inicial
    const [isZoomed, setIsZoomed] = useState(false);
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

    const handleLogout = () => {
        auth.signOut()
        .then(() => {
            console.log('Usuário deslogado com sucesso');
            setUser(null); // Se você precisar limpar o estado local do usuário
            navigate('/login'); // Redireciona para a página /login
        })
        .catch((error) => {
            console.error('Erro ao deslogar:', error);
        });
    };

    const handleImageClick = () => {
        setIsZoomed(!isZoomed);  // Alterna o estado de zoom
    };

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
        let totalDesconto = 0; // Variáveis com let, pois precisam ser modificadas
        produtos.forEach((produto) => {
            const quantidade = parseInt(quantidades[produto.id] || 0, 10);
            if (quantidade > 0) {
                const preco = parseFloat(produto.preco) || 0;
                const desconto = parseFloat(produto.desconto) || 0;
    
                // Calcular o valor sem desconto
                const totalSemDesconto = quantidade * preco;
    
                // Calcular o valor do desconto
                const valorDesconto = (totalSemDesconto * desconto) / 100;
    
                // Subtrair o valor do desconto do total sem desconto
                total += totalSemDesconto - valorDesconto;
    
                // Acumular o valor do desconto
                totalDesconto += valorDesconto;
            }
        });
    
        setTotalPrice(total);
        setTotalDesconto(totalDesconto); // Atualiza o valor do desconto
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
            validade: produto.validade || '',
        lote: produto.lote || '',
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

            // Atualiza o produto na lista local, sem precisar de refresh
        setProdutos(prevProdutos => prevProdutos.map(produto =>
            produto.id === editingProductId
                ? { ...produto, ...editedProductData, imagem: novaImagemUrl } // Atualiza o produto editado
                : produto
        ));

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

    const handleFiltroValidade = (produtos, tipoFiltro) => {
        return produtos.sort((a, b) => {
            const validadeA = new Date(a.validade);
            const validadeB = new Date(b.validade);

            if (tipoFiltro === 'maisProxima') {
                return validadeA - validadeB; // Ordena pela validade mais próxima
            } else if (tipoFiltro === 'maisDistante') {
                return validadeB - validadeA; // Ordena pela validade mais distante
            }
            return 0;
        });
    };

    const produtosFiltrados = handleFiltroValidade(produtos, tipoFiltro);

    const handleCategoriaChange = (e) => {
        setSelectedCategoria(e.target.value);  // Alterado para setSelectedCategoria
    };

    if (!user) return null;


    return (
        <div className="container-default">
            <aside className="sidebar">
                {/* Sidebar conteúdo */}
                <a href='/home'>
                    <img src={LogoSide} style={{ width: '55px', height: 'auto' }}/>
                    <span>Estocaí</span>
                </a>
                
                <a href='/estoque'>                
                    <img src={EstoqueSide} style={{ width: '45px', height: 'auto' }}/>
                    <span>Estoque</span>
                </a>

                <a href='/adicionarproduto'>               
                    <img src={AddSide} style={{ width: '45px', height: 'auto' }}/>
                    <span>Adicionar</span>
                </a>

                <a href='/cadastro-usuario'>               
                    <img src={FuncionarioSide} style={{ width: '45px', height: 'auto' }}/>
                    <span>Funcionário</span>
                </a>

                <a href='#' onClick={handleLogout}>               
                    <img src={Logout} style={{ width: '45px', height: 'auto' }}/>
                    <span>Sair</span>
                </a>
            </aside>

            <div className="estoque-container">
                <h1>Estoque</h1>

                <div className="estoque-search">
                    <input
                        type="text"
                        placeholder="Pesquisar produto..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="search-input"
                    />
                </div>

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
                </div><br></br>

                <div className="filtro-validade">
    <label>Filtrar por Validade:</label>
    <select
        value={tipoFiltro} // Utiliza o estado tipoFiltro
        onChange={(e) => setTipoFiltro(e.target.value)} // Atualiza o estado com a opção selecionada
    >
        <option value="maisProxima">Validade mais próxima</option>
        <option value="maisDistante">Validade mais distante</option>
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
                            <th>Desconto</th>
                            <th>Estoque</th>
                            <th>Validade</th>
                            <th>Lote</th>
                            <th>Quantidade Para Venda</th>
                            <th>Ações</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredProdutos.map((produto, index) => {
                            const isEstoqueBaixo = produto.quantidade < 30;

                            return (
                                <tr
                                    key={produto.id}
                                    className={isEstoqueBaixo ? 'estoque-baixo' : ''}
                                >
                                    <td>
            {produto.imagem && (
                <img
                    style={{ width: '120px', cursor: 'pointer' }}
                    src={produto.imagem}
                    alt={produto.nome}
                    className="product-image"
                    onClick={handleImageClick}
                />
            )}

            {/* Se estiver em zoom, exibe a imagem em tamanho grande */}
            {isZoomed && (
                <div 
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',  // Fundo escurecido
                        zIndex: 1000,
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        cursor: 'zoom-out',
                    }}
                    onClick={handleImageClick}  // Fecha o zoom ao clicar na área
                >
                    <img
                        src={produto.imagem}
                        alt={produto.nome}
                        style={{
                            maxWidth: '90%',
                            maxHeight: '90%',
                            objectFit: 'contain',
                        }}
                    />
                </div>
            )}
        </td>

                                    <td>{index + 1}</td>
<td>{produto.nome}</td>
<td>{produto.categoria}</td>
<td>R$ {parseFloat(produto.preco).toFixed(2)}</td>
<td>{produto.desconto ? produto.desconto+"%" : "0%"}</td>
                                    <td>
                                        {produto.quantidade}
                                        {isEstoqueBaixo && (
                                            <span className="aviso-estoque"> 🔴 Baixo estoque</span>
                                        )}
                                    </td>
<td>
  {produto.validade
    ? new Date(produto.validade).toLocaleDateString('pt-BR')
    : 'Sem validade 😱'}<br></br>
    {produto.validade
  ? (() => {
      const hoje = new Date();
      const validade = new Date(produto.validade);
      const diff = validade - hoje;
      const diasRestantes = Math.ceil(diff / (1000 * 60 * 60 * 24));

      if (diasRestantes < 0) {
        return 'VENCIDO 💀';
      } else if (diasRestantes <= 20) {
        return `⚠️ Faltam ${diasRestantes} dias para vencer!`;
      } else {
        return `${diasRestantes} dias para vencer`;
      }
    })()
  : 'Sem info 😵'}
</td>

<td>Lote: {produto.lote || 'Sem lote 😢'}</td>
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
        </label>
        <label>
            Desconto %:
            <input
                type="number"
                value={editedProductData.desconto}
                onChange={(e) => setEditedProductData({ ...editedProductData, desconto: e.target.value })}
            />
        </label>
        <label>
            Validade (dd/mm/aaaa):
            <input
                type="text"
                value={editedProductData.validade}
                onChange={(e) => setEditedProductData({ ...editedProductData, validade: e.target.value })}
                placeholder="Ex: 30/12/2025"
            />
        </label>
        <label>
            Lote:
            <input
                type="text"
                value={editedProductData.lote}
                onChange={(e) => setEditedProductData({ ...editedProductData, lote: e.target.value })}
            />
        </label>
        <label>
            Imagem:
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

        {/* Se houver desconto, exibe o valor do desconto */}
        {totalDesconto > 0 && (
            <h3>Desconto: -R${totalDesconto.toFixed(2)}</h3>
        )}
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
        </div>
    );
};

export default Estoque;
