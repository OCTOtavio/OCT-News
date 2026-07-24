// ============================================================
// FIREBASE APP
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";


// ============================================================
// FIRESTORE
// ============================================================

import {
  getFirestore,
  doc,
  runTransaction,
  increment
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";


// ============================================================
// FIREBASE AUTHENTICATION
// ============================================================

import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


// ============================================================
// CONFIGURAÇÃO DO FIREBASE
// ============================================================

const firebaseConfig = {
  apiKey: "AIzaSyCZrMftk4UD76F-wG_VmqAPLtro1tbiElM",
  authDomain: "oct-news-84f17.firebaseapp.com",
  projectId: "oct-news-84f17",
  storageBucket: "oct-news-84f17.firebasestorage.app",
  messagingSenderId: "227674129864",
  appId: "1:227674129864:web:d79de134551d429d8becfd",
  measurementId: "G-KXFREF0YQQ"
};


// ============================================================
// INICIALIZAR FIREBASE
// ============================================================

const app = initializeApp(firebaseConfig);


// ============================================================
// INICIALIZAR FIRESTORE
// ============================================================

const db = getFirestore(app);


// ============================================================
// INICIALIZAR AUTHENTICATION
// ============================================================

const auth = getAuth(app);


// ============================================================
// PROVEDOR GOOGLE
// ============================================================

const provider = new GoogleAuthProvider();


// ============================================================
// CONFIGURAÇÕES
// ============================================================

// Cooldown de 10 minutos

const COOLDOWN = 10 * 60 * 1000;


// ============================================================
// USUÁRIO ATUAL
// ============================================================

let usuarioAtual = null;


// ============================================================
// MONITORAR ESTADO DE LOGIN
// ============================================================

onAuthStateChanged(auth, (user) => {

  if (user) {

    usuarioAtual = user;

    console.log(
      "Usuário autenticado:",
      user.displayName
    );

    console.log(
      "UID:",
      user.uid
    );

  } else {

    usuarioAtual = null;

    console.log(
      "Nenhum usuário autenticado."
    );

  }

});


// ============================================================
// LOGIN COM GOOGLE
// ============================================================

export async function loginGoogle() {

  try {

    console.log(
      "Abrindo login do Google..."
    );


    // Abre o popup do Google

    const resultado = await signInWithPopup(
      auth,
      provider
    );


    // Usuário autenticado

    usuarioAtual = resultado.user;


    console.log(
      "Login realizado com sucesso!"
    );


    console.log(
      "Nome:",
      usuarioAtual.displayName
    );


    console.log(
      "Email:",
      usuarioAtual.email
    );


    console.log(
      "UID:",
      usuarioAtual.uid
    );


    // Depois do login,
    // tenta contabilizar a visualização

    await incrementarView();


    return usuarioAtual;


  } catch (erro) {

    console.error(
      "Erro ao fazer login com Google:",
      erro
    );


    return null;

  }

}


// ============================================================
// CONTABILIZAR VISUALIZAÇÃO
// ============================================================

export async function incrementarView() {

  try {

    // ========================================================
    // VERIFICAR SE EXISTE USUÁRIO AUTENTICADO
    // ========================================================

    if (!usuarioAtual) {

      console.log(
        "Usuário não autenticado."
      );

      console.log(
        "A visualização não será contabilizada."
      );

      return false;

    }


    // ========================================================
    // UID DO USUÁRIO
    // ========================================================

    const uid = usuarioAtual.uid;


    console.log(
      "Verificando visualização para:",
      uid
    );


    // ========================================================
    // REFERÊNCIAS DOS DOCUMENTOS
    // ========================================================

    const userRef = doc(
      db,
      "viewers",
      uid
    );


    const statsRef = doc(
      db,
      "stats",
      "global"
    );


    // ========================================================
    // HORÁRIO ATUAL
    // ========================================================

    const agora = Date.now();


    // ========================================================
    // TRANSAÇÃO
    // ========================================================

    const contabilizou = await runTransaction(
      db,
      async (transaction) => {


        // ====================================================
        // LER DOCUMENTO DO USUÁRIO
        // ====================================================

        const userSnap = await transaction.get(
          userRef
        );


        // ====================================================
        // VERIFICAR ÚLTIMA VISUALIZAÇÃO
        // ====================================================

        if (userSnap.exists()) {

          const dados = userSnap.data();


          const ultimaVisualizacao =
            dados.ultimaVisualizacao || 0;


          // ==================================================
          // VERIFICAR COOLDOWN
          // ==================================================

          const tempoDesdeUltimaView =
            agora - ultimaVisualizacao;


          if (
            tempoDesdeUltimaView < COOLDOWN
          ) {

            console.log(
              "Visualização não contabilizada."
            );


            console.log(
              "Usuário ainda está no cooldown de 10 minutos."
            );


            return false;

          }

        }


        // ====================================================
        // INCREMENTAR VISUALIZAÇÕES
        // ====================================================

        transaction.set(
          statsRef,
          {
            views: increment(1)
          },
          {
            merge: true
          }
        );


        // ====================================================
        // ATUALIZAR ÚLTIMA VISUALIZAÇÃO
        // ====================================================

        transaction.set(
          userRef,
          {
            ultimaVisualizacao: agora,
            ultimaVisualizacaoISO:
              new Date(agora).toISOString()
          },
          {
            merge: true
          }
        );


        // ====================================================
        // RETORNAR SUCESSO
        // ====================================================

        return true;

      }
    );


    // ========================================================
    // RESULTADO
    // ========================================================

    if (contabilizou) {

      console.log(
        "================================"
      );

      console.log(
        "VISUALIZAÇÃO CONTABILIZADA!"
      );

      console.log(
        "================================"
      );

      return true;

    }


    return false;


  } catch (erro) {

    console.error(
      "Erro ao contabilizar visualização:",
      erro
    );


    return false;

  }

}


// ============================================================
// DISPONIBILIZAR FUNÇÕES GLOBALMENTE
// ============================================================

window.loginGoogle = loginGoogle;

window.incrementarView = incrementarView;
