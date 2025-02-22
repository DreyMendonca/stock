import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth'; // Importa o serviço de autenticação
import { getFirestore } from 'firebase/firestore'; // Importa o Firestore
import { getStorage } from 'firebase/storage'; // Importa o serviço de Storage

const firebaseConfig = {
    apiKey: "AIzaSyCL75e3y4pO4siCi3N_jjBDUmLrvFhsba8",
    authDomain: "atrativo-social.firebaseapp.com",
    databaseURL: "https://atrativo-social-default-rtdb.firebaseio.com",
    projectId: "atrativo-social",
    storageBucket: "atrativo-social.appspot.com",
    messagingSenderId: "147961984705",
    appId: "1:147961984705:web:38893f9ea008de50328640",
    measurementId: "G-F09PQ0D4R1"
};

const app = initializeApp(firebaseConfig);  // Inicializa o Firebase com a configuração

// Exportando o auth para autenticação
const auth = getAuth(app);

// Exportando o Firestore
const db = getFirestore(app);

// Exportando o Storage
const storage = getStorage(app);

export { auth, db, storage };  // Agora exporta também o Storage
