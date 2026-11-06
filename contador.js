// ============================================================
// CONTADOR DE VISUALIZAÇÕES - parte visual
// Roda depois que o site.js terminou de desenhar a página.
// ============================================================

import {
  registrarVisualizacao,
  buscarContagens,
  idDoc
} from "./firebase.js";


// A visita só conta depois de X segundos com a aba visível.
// Quem abre e sai na hora (ou abre e esquece em outra aba) não conta.
const TEMPO_MINIMO_SEGUNDOS = 8;

const nf = new Intl.NumberFormat("pt-BR");

const textoViews = (n) =>
  `${nf.format(n)} visualização${n === 1 ? "" : "ões"}`;


// Espera acumular N segundos com a aba visível
function esperarLeitura(segundos) {

  return new Promise((resolve) => {

    let acumulado = 0;

    const timer = setInterval(() => {

      if (document.visibilityState === "visible") {
        acumulado += 1;
      }

      if (acumulado >= segundos) {
        clearInterval(timer);
        resolve();
      }

    }, 1000);
  });
}


function desenhar({ total, porNoticia }, slug) {

  document.querySelectorAll("[data-views-total]").forEach((el) => {
    el.textContent = `👁 ${textoViews(total)} no site`;
    el.hidden = false;
  });

  const caixa = document.getElementById("articleViews");

  if (caixa && slug) {
    caixa.textContent = `👁 ${textoViews(porNoticia[idDoc(slug)] || 0)}`;
    caixa.hidden = false;
  }

  document.querySelectorAll("[data-views-slug]").forEach((el) => {
    el.textContent = `👁 ${nf.format(porNoticia[idDoc(el.dataset.viewsSlug)] || 0)}`;
    el.hidden = false;
  });
}


async function iniciar() {

  try {

    const pagina = document.body.dataset.page;
    const slug = new URLSearchParams(location.search).get("slug");
    const ehNoticia = pagina === "article" && slug;

    // 1) Mostra os números atuais na hora
    const dados = await buscarContagens(ehNoticia ? slug : null);

    desenhar(dados, ehNoticia ? slug : null);

    if (!ehNoticia || navigator.webdriver) return;

    // 2) Só registra depois de a pessoa realmente ler um pouco
    await esperarLeitura(TEMPO_MINIMO_SEGUNDOS);

    const contou = await registrarVisualizacao(slug);

    // 3) Se contou, atualiza o número na tela sem reler o banco
    if (contou) {
      dados.total += 1;
      dados.porNoticia[idDoc(slug)] =
        (dados.porNoticia[idDoc(slug)] || 0) + 1;

      desenhar(dados, slug);
    }

  } catch (erro) {
    // Se o Firebase falhar, o site continua funcionando sem os números
    console.warn("Contador indisponível:", erro);
  }
}


if (document.body.dataset.ready) {
  iniciar();
} else {
  document.addEventListener("oct:ready", iniciar, { once: true });
}
