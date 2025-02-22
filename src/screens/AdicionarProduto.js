import React, { useState, useEffect } from 'react';
import { db, auth, storage } from '../firebase';  // Importa o storage
import { collection, addDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';  // Importa as funções de upload de imagem
import { useNavigate } from 'react-router-dom';
import './AdicionarProduto.css';

export const AdicionarProduto = () => {
    const [produto, setProduto] = useState({
        nome: '',
        preco: '',
        desconto: '',
        quantidade: '',
        sku: '',
        categoria: '',
        variantes: [''],
        imagem: ''  // Novo campo para armazenar a URL da imagem
    });
    const [user, setUser] = useState(null);
    const [imagem, setImagem] = useState(null);  // Armazena o arquivo de imagem
    const navigate = useNavigate();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((currentUser) => {
            if (currentUser) {
                setUser(currentUser);
            } else {
                alert('Você precisa estar logado para adicionar um produto.');
                navigate('/login');
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduto({
            ...produto,
            [name]: value
        });
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagem(file);
        }
    };

    const handleAddProduto = async () => {
        if (!user) {
            alert('Você precisa estar logado para adicionar um produto.');
            return;
        }

        try {
            let imagemUrl = '';
            if (imagem) {
                // Faz o upload da imagem para o Firebase Storage
                const imagemRef = ref(storage, `produtos/${imagem.name}`);
                const snapshot = await uploadBytes(imagemRef, imagem);
                imagemUrl = await getDownloadURL(snapshot.ref);  // Obtém a URL da imagem
            }

            // Salva as informações do produto no Firestore, incluindo o URL da imagem
            await addDoc(collection(db, 'produtos'), {
                ...produto,
                imagem: imagemUrl,  // Adiciona o URL da imagem
                userId: user.uid
            });
            alert('Produto adicionado com sucesso!');
            setProduto({ nome: '', preco: '', desconto: '', quantidade: '', sku: '', categoria: '', variantes: [''] });
            setImagem(null);  // Limpa a imagem
        } catch (error) {
            console.error('Erro ao adicionar produto: ', error);
            alert('Erro ao adicionar produto.');
        }
    };

    return (
        <div className="product-form-container">
            <div className="upload-section">
                <input
                    type="file"
                    onChange={handleImageChange}
                />
            </div>
            <div className="form-section">
                <h2>Adicionar Produto</h2>
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
                <div className="form-row">
                    <div className="form-group">
                        <label>Preço: R$</label>
                        <input
                            type="text"
                            name="preco"
                            value={produto.preco}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>Desconto: %</label>
                        <input
                            type="text"
                            name="desconto"
                            value={produto.desconto}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-row">
                    <div className="form-group">
                        <label>Quantidade</label>
                        <input
                            type="number"
                            name="quantidade"
                            value={produto.quantidade}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label>SKU (Opcional)</label>
                        <input
                            type="text"
                            name="sku"
                            value={produto.sku}
                            onChange={handleChange}
                        />
                    </div>
                </div>
                <div className="form-group">
                    <label>Categoria</label>
                    <input
                        type="text"
                        name="categoria"
                        value={produto.categoria}
                        onChange={handleChange}
                        placeholder="Categoria do Produto"
                    />
                </div>
                <button className="btn add-product-btn" onClick={handleAddProduto}>Adicionar Produto</button>
            </div>
        </div>
    );
};

export default AdicionarProduto;
