// ============================================================
// FIREBASE + CONTADOR DE VISUALIZAÇÕES
// ============================================================
// - Login anônimo e silencioso (o leitor não vê nada, não precisa de Google)
// - Cada notícia tem o seu contador:  views/{id}  ->  { count }
// - O total do site fica em:          stats/global -> { views }
// - Incremento atômico (increment) + trava de 30 min por navegador/notícia
// ============================================================

import { initializeApp } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-app.js";

import {
  getFirestore,
  doc,
  getDoc,
  getDocs,
  collection,
  writeBatch,
  increment,
  serverTimestamp
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js";

import {
  getAuth,
  signInAnonymously,
  onAuthStateChanged
} from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";


const firebaseConfig = {
  apiKey: "AIzaSyCZrMftk4UD76F-wG_VmqAPLtro1tbiElM",
  authDomain: "oct-news-84f17.firebaseapp.com",
  projectId: "oct-news-84f17",
  storageBucket: "oct-news-84f17.firebasestorage.app",
  messagingSenderId: "227674129864",
  appId: "1:227674129864:web:d79de134551d429d8becfd",
  measurementId: "G-KXFREF0YQQ"
};

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);


// Mesma pessoa, mesma notícia: só conta de novo depois de 30 minutos
const COOLDOWN = 30 * 60 * 1000;

const memoria = new Map(); // plano B se o navegador bloquear o localStorage


// ------------------------------------------------------------
// ID seguro do documento (o slug pode ter caracteres estranhos)
// ------------------------------------------------------------
export function idDoc(slug) {
  return "n_" + String(slug).replace(/[^A-Za-z0-9_-]/g, "_").slice(0, 120);
}


// ------------------------------------------------------------
// Login anônimo (reaproveita a sessão se já existir)
// ------------------------------------------------------------
async function garantirUsuario() {

  const atual = await new Promise((resolve) => {
    const parar = onAuthStateChanged(auth, (user) => {
      parar();
      resolve(user);
    });
  });

  if (atual) return atual;

  const cred = await signInAnonymously(auth);
  return cred.user;
}


// ------------------------------------------------------------
// Trava local: já contei essa notícia há pouco tempo?
// ------------------------------------------------------------
function jaContou(id) {

  const chave = "oct_view:" + id;
  let ultimo = 0;

  try {
    ultimo = Number(localStorage.getItem(chave)) || 0;
  } catch {
    ultimo = memoria.get(chave) || 0;
  }

  return Date.now() - ultimo < COOLDOWN;
}

function marcarContou(id) {

  const chave = "oct_view:" + id;
  const agora = Date.now();

  memoria.set(chave, agora);

  try {
    localStorage.setItem(chave, String(agora));
  } catch { /* sem localStorage: fica só na memória */ }
}


// ------------------------------------------------------------
// REGISTRAR VISUALIZAÇÃO DE UMA NOTÍCIA
// Retorna true se contou, false se ignorou ou deu erro.
//
// Três escritas atômicas (todas ou nenhuma):
//   seen/{uid}_{id}  -> marca "este visitante leu isto agora"
//   views/{id}       -> +1 na notícia
//   stats/global     -> +1 no total
// As regras do Firestore só aceitam o +1 se o "seen" respeitar
// o intervalo de 30 min, então a trava vale mesmo que alguém
// apague o localStorage ou mexa no código do navegador.
// ------------------------------------------------------------
export async function registrarVisualizacao(slug) {

  const id = idDoc(slug);

  try {

    if (jaContou(id)) return false;

    const user = await garantirUsuario();

    const lote = writeBatch(db);

    lote.set(
      doc(db, "seen", `${user.uid}_${id}`),
      { t: serverTimestamp() }
    );

    lote.set(
      doc(db, "views", id),
      { count: increment(1) },
      { merge: true }
    );

    lote.set(
      doc(db, "stats", "global"),
      { views: increment(1), ultimoId: id },
      { merge: true }
    );

    await lote.commit();

    marcarContou(id);

    return true;

  } catch (erro) {

    // permission-denied = o servidor recusou (ainda no intervalo de 30 min,
    // ou outra aba contou no mesmo instante). Não insiste de novo.
    if (erro && erro.code === "permission-denied") {
      marcarContou(id);
    }

    console.warn("Contador: visualização não registrada.", erro);
    return false;
  }
}


// ------------------------------------------------------------
// LER CONTAGENS
// - com slug: só aquela notícia + total (2 leituras)
// - sem slug: todas as notícias + total
// ------------------------------------------------------------
export async function buscarContagens(slug = null) {

  const porNoticia = {};

  const totalSnap = await getDoc(doc(db, "stats", "global"));
  const total = totalSnap.exists() ? (totalSnap.data().views || 0) : 0;

  if (slug) {

    const id = idDoc(slug);
    const snap = await getDoc(doc(db, "views", id));

    porNoticia[id] = snap.exists() ? (snap.data().count || 0) : 0;

  } else {

    const todos = await getDocs(collection(db, "views"));

    todos.forEach((d) => {
      porNoticia[d.id] = d.data().count || 0;
    });
  }

  return { total, porNoticia };
}
