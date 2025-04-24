import { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { auth, db } from '../firebase';
import { collection, doc, getDoc, query, where, getDocs } from 'firebase/firestore'; // Adicionei collection aqui

const AdminRoute = ({ children }) => {
    const [status, setStatus] = useState({
        loading: true,
        isAdmin: false,
        error: null
    });
    
    const location = useLocation();

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged(async (user) => {
            if (user) {
                console.log('UID do Auth:', user.uid);
                
                try {
                    const querySnapshot = await getDocs(
                        query(collection(db, 'usuarios'), 
                        where('uid', '==', user.uid))
                    );
                    
                    if (!querySnapshot.empty) {
                        const userData = querySnapshot.docs[0].data();
                        console.log('Dados encontrados:', userData);
                        setStatus({
                            loading: false,
                            isAdmin: userData.role === 'admin',
                            error: null
                        });
                    } else {
                        console.log('Nenhum documento com este UID');
                        setStatus({
                            loading: false,
                            isAdmin: false,
                            error: 'Usuário não encontrado no banco de dados'
                        });
                    }
                } catch (error) {
                    console.error('Erro ao buscar usuário:', error);
                    setStatus({
                        loading: false,
                        isAdmin: false,
                        error: error.message
                    });
                }
            } else {
                setStatus({ 
                    loading: false, 
                    isAdmin: false,
                    error: 'Nenhum usuário autenticado'
                });
            }
        });
    
        return () => unsubscribe();
    }, []);

    if (status.loading) {
        return <div>Verificando permissões...</div>;
    }

    if (status.error) {
        console.error('Erro na verificação:', status.error);
        return <Navigate to="/login" state={{ 
            from: location.pathname, 
            error: status.error 
        }} replace />;
    }

    if (!status.isAdmin) {
        console.log('Redirecionando para /login - Usuário não é admin');
        return <Navigate to="/login" state={{ from: location.pathname }} replace />;
    }
    
    return children;
};

export default AdminRoute;