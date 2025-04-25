import { useState, useEffect } from 'react';
import { db, auth, storage } from '../../firebase';
import { collection, addDoc, getDocs } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useNavigate } from 'react-router-dom';

export const UseAdicionarProduto = () => {
    const [produto, setProduto] = useState({
        nome: '',
        preco: '',
        desconto: '',
        quantidade: '',
        sku: '',
        categoria: '',
        variantes: [''],
        imagem: ''
    });

    const [imagem, setImagem] = useState(null);
    const [categorias, setCategorias] = useState([]);
    const [novaCategoria, setNovaCategoria] = useState('');
    const [mostrarCriarCategoria, setMostrarCriarCategoria] = useState(false);
    const [user, setUser] = useState(null);
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

    useEffect(() => {
        const fetchCategorias = async () => {
            if (!user) return;
            try {
                const querySnapshot = await getDocs(collection(db, 'categorias'));
                const categoriasFirebase = querySnapshot.docs
                    .filter(doc => doc.data().userId === user.uid)
                    .map(doc => doc.data().nome);
                setCategorias(categoriasFirebase);
            } catch (error) {
                console.error('Erro ao buscar categorias:', error);
            }
        };

        fetchCategorias();
    }, [user]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setProduto(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setImagem(file);
        }
    };

    const handleAdicionarCategoria = async () => {
        const nomeCategoria = novaCategoria.trim();
        if (nomeCategoria) {
            try {
                await addDoc(collection(db, 'categorias'), {
                    nome: nomeCategoria,
                    userId: user.uid
                });
                setCategorias([...categorias, nomeCategoria]);
                setProduto({ ...produto, categoria: nomeCategoria });
                setNovaCategoria('');
                setMostrarCriarCategoria(false);
            } catch (error) {
                console.error('Erro ao salvar categoria:', error);
                alert('Erro ao salvar a categoria.');
            }
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
                const imagemRef = ref(storage, `produtos/${imagem.name}`);
                const snapshot = await uploadBytes(imagemRef, imagem);
                imagemUrl = await getDownloadURL(snapshot.ref);
            }

            await addDoc(collection(db, 'produtos'), {
                ...produto,
                imagem: imagemUrl,
                userId: user.uid
            });

            await addDoc(collection(db, 'historicoEntradas'), {
                nome: produto.nome,
                quantidade: parseInt(produto.quantidade),
                userId: user.uid,
                data: new Date()
            });

            alert('Produto adicionado com sucesso!');
            setProduto({
                nome: '',
                preco: '',
                desconto: '',
                quantidade: '',
                sku: '',
                categoria: '',
                variantes: [''],
                imagem: ''
            });
            setImagem(null);
        } catch (error) {
            console.error('Erro ao adicionar produto: ', error);
            alert('Erro ao adicionar produto.');
        }
    };

    return {
        produto,
        setProduto,
        imagem,
        setImagem,
        categorias,
        novaCategoria,
        setNovaCategoria,
        mostrarCriarCategoria,
        setMostrarCriarCategoria,
        handleChange,
        handleImageChange,
        handleAddProduto,
        handleAdicionarCategoria
    };
};
export default UseAdicionarProduto;
