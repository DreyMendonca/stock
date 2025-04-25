import { useState, useEffect } from 'react';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage, db, auth } from '../../firebase';
import { collection, getDocs, updateDoc, doc, addDoc, deleteDoc } from 'firebase/firestore';
import { useNavigate } from 'react-router-dom';

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
    const [selectedCategoria, setSelectedCategoria] = useState('');  
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
        setSelectedCategoria(e.target.value);
    };

    return {
        produtos,
        categorias,
        searchTerm,
        setSearchTerm,
        quantidades,
        setQuantidades,
        totalPrice,
        setTotalPrice,
        showQRCode,
        setShowQRCode,
        isLoading,
        paymentCompleted,
        setPaymentCompleted,
        editingProductId,
        editedProductData,
        imagem,
        setImagem,
        selectedCategoria,
        handleCategoriaChange,
        handleQuantityChange,
        handleCalcular,
        handleFinalizarCompra,
        handleConfirmarPagamento,
        handleDelete,
        handleEditClick,
        handleCancelEdit,
        handleSaveEdit
    };
};
export default Estoque;
