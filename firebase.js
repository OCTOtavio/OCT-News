// Firebase App
import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

// Firestore
import {
  getFirestore,
  doc,
  getDoc,
  setDoc,
  updateDoc,
  increment
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

// Authentication
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

// Configuração do Firebase
const firebaseConfig = {
  apiKey: "AIzaSyCZrMft4UD76F-wG_VmqAPLtro1tbiElM",
  authDomain: "oct-news-84f17.firebaseapp.com",
  projectId: "oct-news-84f17",
  storageBucket: "oct-news-84f17.firebasestorage.app",
  messagingSenderId: "227674129864",
  appId: "1:227674129864:web:d79de134551d429d8becfd",
  measurementId: "G-KXFREF0YQQ"
};

// Inicializar Firebase
const app = initializeApp(firebaseConfig);

// Inicializar Firestore
const db = getFirestore(app);

// Inicializar Authentication
const auth = getAuth(app);

// Provedor Google
const provider = new GoogleAuthProvider();


// ========================================
// CONTABILIZAR VISUALIZAÇÃO
// ========================================

export async function incrementarView() {

  try {

    // Faz login com Google
    const resultado = await signInWithPopup(auth, provider);

    // Usuário autenticado
    const user = resultado.user;

    // ID único da conta Google
    const uid = user.uid;

    console.log("Usuário:", user.displayName);
    console.log("UID:", uid);


    // Documento que guarda o usuário
    const userRef = doc(db, "viewers", uid);

    // Procura o usuário no banco
    const userSnap = await getDoc(userRef);

    const agora = Date.now();

    // 10 minutos em milissegundos
    const cooldown = 10 * 60 * 1000;


    // ========================================
    // USUÁRIO JÁ EXISTE
    // ========================================

    if (userSnap.exists()) {

      const dados = userSnap.data();

      const ultimaView = dados.ultimaVisualizacao || 0;

      // Verifica se ainda está no cooldown
      if (agora - ultimaView < cooldown) {

        console.log(
          "Visualização não contabilizada. Usuário ainda está no cooldown."
        );

        return;
      }
    }


    // ========================================
    // CONTABILIZAR NOVA VISUALIZAÇÃO
    // ========================================

    const statsRef = doc(db, "stats", "global");

    await setDoc(
      statsRef,
      {
        views: increment(1)
      },
      {
        merge: true
      }
    );


    // ========================================
    // SALVAR DATA DA ÚLTIMA VISUALIZAÇÃO
    // ========================================

    await setDoc(
      userRef,
      {
        ultimaVisualizacao: agora
      },
      {
        merge: true
      }
    );


    console.log("Visualização contabilizada!");

  } catch (erro) {

    console.error(
      "Erro ao contabilizar visualização:",
      erro
    );

  }

}


// Disponibiliza para o HTML
window.incrementarView = incrementarView;
