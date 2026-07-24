import { initializeApp } from "https://gstatic.com";
import { getFirestore, doc, updateDoc, increment } from "https://gstatic.com";

// Suas chaves reais copiadas do painel do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCzRMftk4UD76f-wG_VmqAPLtroitbiElM",
  authDomain: "://firebaseapp.com",
  projectId: "oct-news-84f17",
  storageBucket: "oct-news-84f17.firebasestorage.app",
  messagingSenderId: "227674129864",
  appId: "1:227674129864:web:d79de134551d429d8becfd",
  measurementId: "G-KXFREF0YQQ"
};

// Inicializa o Firebase e o Banco de Dados
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// Função que aumenta o contador
export async function incrementarView() {
  const docRef = doc(db, "stats", "global");
  try {
    await updateDoc(docRef, {
      views: increment(1)
    });
    console.log("View contabilizada com sucesso!");
  } catch (erro) {
    console.error("Erro ao incrementar:", erro);
  }
}

// Permite usar a função direto no HTML se necessário
window.incrementarView = incrementarView;
