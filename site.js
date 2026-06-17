const SERVER =
"https://octotavio.github.io/OCT-feira-de-ciencias-2026-servidor";

const SERVER_JSON =
`${SERVER}/server.json`;

async function fetchJson(path) {
  const response = await fetch(path, {
    cache: "no-store"
  });

  if (!response.ok) {
    throw new Error(`Falha ao carregar ${path}`);
  }

  return response.json();
}

function formatDate(value) {
  if (!value) return "Data não informada";

  const parsed = new Date(`${value}T12:00:00`);

  if (Number.isNaN(parsed.getTime())) {
    return value;
  }

  return new Intl.DateTimeFormat("pt-BR", {
    day: "2-digit",
    month: "long",
    year: "numeric"
  }).format(parsed);
}

function buildCategoryUrl(category, subcategory = "") {
  const params = new URLSearchParams();

  params.set("categoria", category);

  if (subcategory) {
    params.set("subcategoria", subcategory);
  }

  return `categoria.html?${params.toString()}`;
}

function buildArticleUrl(slug) {
  const params = new URLSearchParams();

  params.set("slug", slug);

  return `noticia.html?${params.toString()}`;
}

function readParams() {
  return new URLSearchParams(window.location.search);
}

function safeText(value, fallback = "") {
  return value || fallback;
}

function byDateDesc(a, b) {
  return String(b.data || "")
    .localeCompare(String(a.data || ""));
}

function buildMediaUrl(path) {
  if (!path) return "";

  return `${SERVER}/${path}`;
}

function setPageTitle(config, label = "") {
  document.title =
    label
      ? `${config.Nome} - ${label}`
      : config.Nome;
}

function applySiteConfig(config) {

  document
    .querySelectorAll("[data-site-name]")
    .forEach((node) => {
      node.textContent = config.Nome;
    });

  document
    .querySelectorAll("[data-site-description]")
    .forEach((node) => {
      node.textContent = config.Descricao;
    });

  document
    .querySelectorAll("[data-school-name]")
    .forEach((node) => {
      node.textContent = config.Escola;
    });

  document
    .querySelectorAll("[data-footer-text]")
    .forEach((node) => {
      node.textContent = config.Rodape;
    });

  const favicon =
    document.querySelector("link[rel='icon']");

  if (favicon && config.Icone) {
    favicon.href = config.Icone;
  }

  const currentDate =
    document.getElementById("currentDate");

  if (currentDate) {
    currentDate.textContent =
      new Intl.DateTimeFormat("pt-BR", {
        day: "2-digit",
        month: "long",
        year: "numeric"
      }).format(new Date());
  }
}

function renderNav(config) {

  const mount =
    document.getElementById("navLinks");

  if (!mount) return;

  mount.replaceChildren();

  config.Categorias
    .slice(0, 4)
    .forEach((item) => {

      const link =
        document.createElement("a");

      link.href =
        buildCategoryUrl(item.Categoria);

      link.textContent =
        item.Categoria;

      mount.appendChild(link);
    });
}

function createMedia(path, alt, className) {

  const wrapper =
    document.createElement("div");

  wrapper.className = className;

  if (!path) {

    wrapper.innerHTML = `
      <div class="placeholder">
        Imagem indisponível
      </div>
    `;

    return wrapper;
  }

  const img =
    document.createElement("img");

  img.src = path;
  img.alt = alt;
  img.loading = "lazy";

  img.onerror = () => {
    wrapper.innerHTML = `
      <div class="placeholder">
        Imagem indisponível
      </div>
    `;
  };

  wrapper.appendChild(img);

  return wrapper;
}

function createStoryCard(news) {

  const article =
    document.createElement("article");

  article.className = "story-card";

  article.onclick = () => {
    window.location.href =
      buildArticleUrl(news.slug);
  };

  const media =
    createMedia(
      news.imagemCapa
        ? buildMediaUrl(
            `${news.pasta}/${news.imagemCapa}`
          )
        : "",
      news.titulo || "Imagem da matéria",
      "story-media"
    );

  const copy =
    document.createElement("div");

  copy.className = "story-copy";

  copy.innerHTML = `
    <span class="story-tag">
      ${news.categoria}
      ${news.subcategoria
        ? ` • ${news.subcategoria}`
        : ""}
    </span>

    <h3>
      ${safeText(news.titulo, "Sem título")}
    </h3>

    <p>
      ${safeText(
        news.resumo,
        "Resumo indisponível."
      )}
    </p>

    <div class="meta-row">
      <span class="meta-badge">
        ${formatDate(news.data)}
      </span>
    </div>
  `;

  article.append(media, copy);

  return article;
}

function renderHome(config, newsList) {

  setPageTitle(config);

  document.getElementById("heroTitle")
    .textContent = config.HeroTitulo;

  document.getElementById("heroSummary")
    .textContent = config.HeroResumo;

  const featureMount =
    document.getElementById("heroFeature");

  const featuredNews =
    newsList[0];

  if (featuredNews) {

    featureMount.innerHTML = `
      <span class="feature-kicker">
        Destaque do dia
      </span>

      <h2>
        ${featuredNews.titulo}
      </h2>

      <p>
        ${featuredNews.resumo}
      </p>

      <div class="meta-row">
        <span class="meta-badge">
          ${featuredNews.categoria}
        </span>

        ${featuredNews.subcategoria
          ? `
            <span class="meta-badge">
              ${featuredNews.subcategoria}
            </span>
          `
          : ""}

        <span class="meta-badge">
          ${formatDate(featuredNews.data)}
        </span>
      </div>
    `;

    featureMount.style.cursor = "pointer";

    featureMount.onclick = () => {
      window.location.href =
        buildArticleUrl(featuredNews.slug);
    };
  }

  const categoryGrid =
    document.getElementById("categoryGrid");

  categoryGrid.replaceChildren();

  config.Categorias.forEach((item) => {

    const count =
      newsList.filter(
        (news) =>
          news.categoria === item.Categoria
      ).length;

    const card =
      document.createElement("article");

    card.className = "category-card";

    const header =
      document.createElement("div");

    header.innerHTML = `
      <span class="section-kicker">
        Editoria
      </span>

      <h3>
        ${item.Categoria}
      </h3>

      <p>
        ${count} matéria${count === 1 ? "" : "s"}
        vinculada${count === 1 ? "" : "s"}
        no portal.
      </p>
    `;

    const chips =
      document.createElement("div");

    chips.className = "chip-row";

    const categoryLink =
      document.createElement("a");

    categoryLink.className = "chip-link";

    categoryLink.href =
      buildCategoryUrl(item.Categoria);

    categoryLink.textContent =
      "Abrir editorial";

    chips.appendChild(categoryLink);

    item.Subcategorias.forEach((sub) => {

      const subLink =
        document.createElement("a");

      subLink.className = "chip-link";

      subLink.href =
        buildCategoryUrl(
          item.Categoria,
          sub
        );

      subLink.textContent = sub;

      chips.appendChild(subLink);
    });

    card.append(header, chips);

    categoryGrid.appendChild(card);
  });

  const featuredMount =
    document.getElementById("featuredNews");

  featuredMount.replaceChildren();

  if (featuredNews) {

    const card =
      document.createElement("article");

    card.className = "featured-card";

    card.onclick = () => {
      window.location.href =
        buildArticleUrl(featuredNews.slug);
    };

    const media =
      createMedia(
        featuredNews.imagemCapa
          ? buildMediaUrl(
              `${featuredNews.pasta}/${featuredNews.imagemCapa}`
            )
          : "",
        featuredNews.titulo ||
          "Imagem da matéria",
        "featured-media"
      );

    const copy =
      document.createElement("div");

    copy.className = "featured-copy";

    copy.innerHTML = `
      <span class="feature-kicker">
        ${featuredNews.categoria}
      </span>

      <h2>
        ${featuredNews.titulo}
      </h2>

      <p>
        ${featuredNews.resumo}
      </p>

      <div class="meta-row">

        ${featuredNews.subcategoria
          ? `
            <span class="meta-badge">
              ${featuredNews.subcategoria}
            </span>
          `
          : ""}

        <span class="meta-badge">
          ${formatDate(featuredNews.data)}
        </span>
      </div>
    `;

    card.append(media, copy);

    featuredMount.appendChild(card);
  }

  const latestMount =
    document.getElementById("latestNews");

  latestMount.replaceChildren();

  newsList.forEach((news) => {
    latestMount.appendChild(
      createStoryCard(news)
    );
  });
}

function renderCategory(config, newsList) {

  const params =
    readParams();

  const category =
    params.get("categoria") || "";

  const subcategory =
    params.get("subcategoria") || "";

  const categoryData =
    config.Categorias.find(
      (item) =>
        item.Categoria === category
    );

  setPageTitle(
    config,
    subcategory
      ? `${category} (${subcategory})`
      : category
  );

  document.getElementById(
    "categoryBreadcrumb"
  ).innerHTML = `
    <a href="index.html">
      ${config.Nome}
    </a>

    /

    <span>
      ${category || "Editoria"}
    </span>

    ${subcategory
      ? `
        /
        <span>${subcategory}</span>
      `
      : ""}
  `;

  document.getElementById(
    "categoryTitle"
  ).textContent =
    subcategory
      ? `${category} (${subcategory})`
      : category;

  document.getElementById(
    "categorySummary"
  ).textContent =
    subcategory
      ? `
        As matérias abaixo pertencem
        à editoria ${category}
        e à subcategoria ${subcategory}.
      `
      : `
        As matérias abaixo pertencem
        à editoria ${category}.
      `;

  const chips =
    document.getElementById(
      "subCategoryChips"
    );

  chips.replaceChildren();

  if (categoryData) {

    const allLink =
      document.createElement("a");

    allLink.className = "chip-link";

    allLink.href =
      buildCategoryUrl(
        categoryData.Categoria
      );

    allLink.textContent = "Todas";

    chips.appendChild(allLink);

    categoryData.Subcategorias
      .forEach((sub) => {

        const link =
          document.createElement("a");

        link.className = "chip-link";

        link.href =
          buildCategoryUrl(
            categoryData.Categoria,
            sub
          );

        link.textContent = sub;

        chips.appendChild(link);
      });
  }

  const filtered =
    newsList.filter((item) => {

      if (item.categoria !== category) {
        return false;
      }

      if (!subcategory) {
        return true;
      }

      return (
        item.subcategoria === subcategory
      );
    });

  document.getElementById(
    "categoryCountText"
  ).textContent = `
    ${filtered.length}
    matéria${filtered.length === 1 ? "" : "s"}
    encontrada${filtered.length === 1 ? "" : "s"}
    para esta editoria.
  `;

  const featuredMount =
    document.getElementById(
      "categoryFeatured"
    );

  featuredMount.replaceChildren();

  const [featured] = filtered;

  if (featured) {

    const card =
      document.createElement("article");

    card.className = "featured-card";

    card.onclick = () => {
      window.location.href =
        buildArticleUrl(featured.slug);
    };

    card.append(
      createMedia(
        featured.imagemCapa
          ? buildMediaUrl(
              `${featured.pasta}/${featured.imagemCapa}`
            )
          : "",
        featured.titulo,
        "featured-media"
      )
    );

    const copy =
      document.createElement("div");

    copy.className = "featured-copy";

    copy.innerHTML = `
      <span class="feature-kicker">
        ${featured.categoria}
        ${featured.subcategoria
          ? ` • ${featured.subcategoria}`
          : ""}
      </span>

      <h2>
        ${featured.titulo}
      </h2>

      <p>
        ${featured.resumo}
      </p>

      <div class="meta-row">
        <span class="meta-badge">
          ${formatDate(featured.data)}
        </span>
      </div>
    `;

    card.appendChild(copy);

    featuredMount.appendChild(card);
  }

  const grid =
    document.getElementById(
      "categoryNewsGrid"
    );

  grid.replaceChildren();

  const empty =
    document.getElementById(
      "categoryEmpty"
    );

  if (!filtered.length) {
    empty.hidden = false;
    return;
  }

  empty.hidden = true;

  filtered.forEach((news) => {
    grid.appendChild(
      createStoryCard(news)
    );
  });
}

async function loadArticle(slug, newsList) {

  const metadata =
    newsList.find(
      (item) => item.slug === slug
    );

  if (!metadata) {
    throw new Error(
      "Notícia não encontrada"
    );
  }

  const data =
    await fetchJson(
      buildMediaUrl(metadata.estrutura)
    );

  return {
    ...metadata,
    ...data
  };
}

async function renderArticle(
  config,
  article
) {

  setPageTitle(
    config,
    article.titulo ||
      article.categoria
  );

  const categoryLabel =
    article.subcategoria
      ? `
        ${article.categoria}
        (${article.subcategoria})
      `
      : article.categoria;

  document.getElementById(
    "articleBreadcrumb"
  ).innerHTML = `
    <a href="index.html">
      ${config.Nome}
    </a>

    /

    <a href="
      ${buildCategoryUrl(article.categoria)}
    ">
      ${article.categoria}
    </a>

    ${article.subcategoria
      ? `
        /
        <a href="
          ${buildCategoryUrl(
            article.categoria,
            article.subcategoria
          )}
        ">
          ${article.subcategoria}
        </a>
      `
      : ""}
  `;

  document.getElementById(
    "articleCategoryTag"
  ).textContent = categoryLabel;

  document.getElementById(
    "articleTitle"
  ).textContent =
    article.titulo || "Sem título";

  document.getElementById(
    "articleSummary"
  ).textContent =
    article.resumo ||
    "Resumo indisponível.";

  document.getElementById(
    "articleMeta"
  ).innerHTML = `
    <span class="meta-badge">
      ${formatDate(article.data)}
    </span>

    <span class="meta-badge">
      ${article.categoria}
    </span>

    ${article.subcategoria
      ? `
        <span class="meta-badge">
          ${article.subcategoria}
        </span>
      `
      : ""}
  `;

  const cover =
    document.getElementById(
      "articleCover"
    );

  cover.replaceChildren();

  cover.appendChild(
    createMedia(
      article.imagemCapa
        ? buildMediaUrl(
            `${article.pasta}/${article.imagemCapa}`
          )
        : "",
      article.titulo ||
        "Imagem da matéria",
      "article-hero-media"
    )
  );

  const railText =
    document.getElementById(
      "articleRailText"
    );

  railText.textContent =
    article.resumo ||
    "Resumo indisponível.";

  const railList =
    document.getElementById(
      "articleRailList"
    );

  railList.replaceChildren();

  [
    `Editoria: ${article.categoria}`,

    article.subcategoria
      ? `Subcategoria: ${article.subcategoria}`
      : "Sem subcategoria definida",

    `Publicação: ${formatDate(article.data)}`
  ].forEach((text) => {

    const item =
      document.createElement("li");

    item.textContent = text;

    railList.appendChild(item);
  });

  const content =
    document.getElementById(
      "articleContent"
    );

  content.replaceChildren();

  for (const block of article.conteudo || []) {

    if (block.tipo === "titulo") {

      const h2 =
        document.createElement("h2");

      h2.textContent =
        block.texto || "";

      content.appendChild(h2);
    }

    if (block.tipo === "texto") {

      const p =
        document.createElement("p");

      try {

        p.textContent =
          await fetch(
            buildMediaUrl(
              `${article.pasta}/${block.arquivo}`
            ),
            {
              cache: "no-store"
            }
          ).then((response) =>
            response.text()
          );

      } catch (error) {

        p.textContent = `
          Não foi possível carregar
          este bloco de texto.
        `;
      }

      content.appendChild(p);
    }

    if (block.tipo === "imagem") {

      const figure =
        document.createElement("figure");

      const media =
        createMedia(
          buildMediaUrl(
            `${article.pasta}/${block.arquivo}`
          ),
          block.legenda ||
            article.titulo,
          ""
        );

      figure.appendChild(
        media.firstElementChild || media
      );

      if (block.legenda) {

        const caption =
          document.createElement(
            "figcaption"
          );

        caption.textContent =
          block.legenda;

        figure.appendChild(caption);
      }

      content.appendChild(figure);
    }

    if (block.tipo === "video") {

      const video =
        document.createElement("video");

      video.controls = true;

      video.src =
        buildMediaUrl(
          `${article.pasta}/${block.arquivo}`
        );

      content.appendChild(video);
    }

    if (block.tipo === "audio") {

      const audio =
        document.createElement("audio");

      audio.controls = true;

      audio.src =
        buildMediaUrl(
          `${article.pasta}/${block.arquivo}`
        );

      content.appendChild(audio);
    }

    if (block.tipo === "documento") {

      const link =
        document.createElement("a");

      link.className = "chip-link";

      link.href =
        buildMediaUrl(
          `${article.pasta}/${block.arquivo}`
        );

      link.target = "_blank";

      link.rel =
        "noopener noreferrer";

      link.textContent =
        block.legenda ||
        "Abrir documento";

      content.appendChild(link);
    }
  }
}

async function init() {

  try {

    const serverData =
      await fetchJson(
        SERVER_JSON
      );

    const oct =
      serverData["OCT-News"];

    const editoria =
      oct.Presente;

    const categoriasMap =
      new Map();

    editoria.Noticias.forEach((news) => {

      if (
        !categoriasMap.has(news.categoria)
      ) {

        categoriasMap.set(
          news.categoria,
          {
            Categoria: news.categoria,
            Subcategorias: []
          }
        );
      }

      if (
        news.subcategoria &&
        !categoriasMap
          .get(news.categoria)
          .Subcategorias
          .includes(news.subcategoria)
      ) {

        categoriasMap
          .get(news.categoria)
          .Subcategorias
          .push(news.subcategoria);
      }
    });

    const config = {

      Nome: "OCT News",

      Descricao:
        "Portal de notícias da Escola Estadual Orlando da Costa Telles.",

      Escola:
        "Escola Estadual Orlando da Costa Telles",

      Rodape:
        "OCT News © 2026",

      HeroTitulo:
        "Os editoriais que movem a rotina da Orlando da Costa Telles.",

      HeroResumo:
        "Um portal moderno com notícias climáticas, científicas, sociais e acontecimentos que impactam a comunidade escolar.",

      Categorias:
        Array.from(
          categoriasMap.values()
        )
    };

    const newsList =
      editoria.Noticias
        .sort(byDateDesc);

    applySiteConfig(config);

    renderNav(config);

    const page =
      document.body.dataset.page;

    if (page === "home") {

      renderHome(
        config,
        newsList
      );

      return;
    }

    if (page === "category") {

      renderCategory(
        config,
        newsList
      );

      return;
    }

    if (page === "article") {

      const slug =
        readParams().get("slug");

      if (!slug) {
        throw new Error(
          "Slug não informado"
        );
      }

      const article =
        await loadArticle(
          slug,
          newsList
        );

      await renderArticle(
        config,
        article
      );
    }

  } catch (error) {

    console.error(error);

    document.body.innerHTML = `
      <main
        class="shell"
        style="
          padding: 32px 0 56px;
        "
      >

        <div class="empty-state">

          Não foi possível carregar
          o portal agora.

          Verifique:

          <br><br>

          • conexão com internet

          <br>

          • server.json

          <br>

          • GitHub Pages

          <br>

          • estrutura das notícias

        </div>

      </main>
    `;
  }
}

init();
