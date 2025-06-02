import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
  redirecionarParaLogin,
  redirecionarParaCadastroUser,
  redirecionarParaCadastroEmpresa,
  redirecionarParaCadastroObra,
  redirecionarParaMenuEmpresa
} from "./redirecionar.js";

// Tornando as funções globais para uso nos botões
window.redirecionarParaLogin = redirecionarParaLogin;
window.redirecionarParaCadastroUser = redirecionarParaCadastroUser;
window.redirecionarParaCadastroEmpresa = redirecionarParaCadastroEmpresa;
window.redirecionarParaCadastroObra = redirecionarParaCadastroObra;
window.redirecionarParaMenuEmpresa = redirecionarParaMenuEmpresa;
window.redirecionarParaDetalhesObra = (id) => {
  console.log("Detalhes obra:", id);
  // window.location.href = `detalhesObra.html?id=${id}`;
};
window.redirecionarParaDetalhesEpi = (id) => {
  console.log("Detalhes EPI:", id);
  window.location.href = "epi.html";
};

// Formata data de criação para exibição
function formatCriadoEm(data) {
  if (data.criadoEm && typeof data.criadoEm.toDate === "function") {
    const date = data.criadoEm.toDate();
    return date.toLocaleString("pt-BR", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "America/Sao_Paulo",
      timeZoneName: "short"
    }).replace(" às", " às");
  }
  return "Data não disponível";
}

// Busca e renderiza dados de uma coleção no Firestore
async function fetchAndRenderData(collectionName, listId, renderFields) {
  const listElement = document.getElementById(listId);
  if (!listElement) {
    console.error(`Elemento ${listId} não encontrado!`);
    return { element: null, error: true };
  }
  listElement.innerHTML = "";

  const coll = collection(db, collectionName);
  const snapshot = await getDocs(coll);

  if (snapshot.empty) {
    listElement.innerHTML = `<tr><td colspan='5'>Nenhum ${collectionName} encontrado.</td></tr>`;
  } else {
    if (collectionName === "obras") {
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const obraId = docSnapshot.id;
        console.log(`Rendering obra ${obraId}:`, data);
        const tr = document.createElement("tr");

        const tdEndereco = document.createElement("td");
        tdEndereco.textContent = data.endereco || "N/A";
        tr.appendChild(tdEndereco);

        const tdResponsavel = document.createElement("td");
        tdResponsavel.textContent = data.responsavel_tecnico || data.responsavelTecnico || "N/A";
        tr.appendChild(tdResponsavel);

        const tdStatus = document.createElement("td");
        tdStatus.textContent = data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "Ativa";
        tr.appendChild(tdStatus);

        const tdAcoes = document.createElement("td");
        tdAcoes.innerHTML = `<a href="#" onclick="redirecionarParaDetalhesObra('${obraId}')">Ver</a>`;
        tr.appendChild(tdAcoes);

        listElement.appendChild(tr);
      });
    } else if (collectionName === "epis") {
      const obrasSnapshot = await getDocs(collection(db, "obras"));
      snapshot.forEach((docSnapshot) => {
        const epiData = docSnapshot.data();
        const epiId = docSnapshot.id;
        console.log(`Rendering EPI ${epiId}:`, epiData);
        const obra = obrasSnapshot.docs.find(obraDoc => obraDoc.id === epiData.obraId);
        const tr = document.createElement("tr");

        const tdTipo = document.createElement("td");
        tdTipo.textContent = epiData.tipo || "N/A";
        tr.appendChild(tdTipo);

        const tdObra = document.createElement("td");
        tdObra.textContent = obra ? (obra.data().nome || obra.data().endereco || "Obra sem nome") : "Não especificada";
        tr.appendChild(tdObra);

        const tdQuantidade = document.createElement("td");
        tdQuantidade.textContent = epiData.quantidade || "N/A";
        tr.appendChild(tdQuantidade);

        const tdStatus = document.createElement("td");
        tdStatus.textContent = epiData.disponibilidade ? epiData.disponibilidade : "N/A";
        tr.appendChild(tdStatus);

        const tdAcoes = document.createElement("td");
        tdAcoes.innerHTML = `<a href="#" onclick="redirecionarParaDetalhesEpi('${epiId}')">Ver</a>`;
        tr.appendChild(tdAcoes);

        listElement.appendChild(tr);
      });
    } else if (collectionName === "users") {
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const p = document.createElement("p");
        p.textContent = data.username || "N/A";
        listElement.appendChild(p);
      });
    } else {
      snapshot.forEach((docSnapshot) => {
        const data = docSnapshot.data();
        const p = document.createElement("p");
        p.textContent = renderFields(data);
        listElement.appendChild(p);
      });
    }
  }
  return { element: listElement, error: false };
}

// Renderiza tabela de empresas com obras relacionadas
async function renderEmpresasTable() {
  const empresasListElement = document.getElementById("empresas-details-list");
  if (!empresasListElement) {
    console.error("Elemento empresas-details-list não encontrado!");
    return;
  }
  empresasListElement.innerHTML = "";

  try {
    const empresasSnapshot = await getDocs(collection(db, "empresas"));
    const obrasSnapshot = await getDocs(collection(db, "obras"));

    if (empresasSnapshot.empty) {
      empresasListElement.innerHTML = "<tr><td colspan='4'>Nenhuma construtora encontrada.</td></tr>";
      return;
    }

    empresasSnapshot.forEach((docSnapshot) => {
      const empresaData = docSnapshot.data();
      const empresaId = docSnapshot.id;
      console.log(`Rendering empresa ${empresaId}:`, empresaData);

      const obrasRelacionadas = obrasSnapshot.docs.filter(
        (obraDoc) => obraDoc.data().empresaId === empresaId
      );

      const tr = document.createElement("tr");

      const tdConstrutora = document.createElement("td");
      tdConstrutora.textContent = empresaData.razaoSocial || "Nome não disponível";
      tr.appendChild(tdConstrutora);

      const tdObras = document.createElement("td");
      if (obrasRelacionadas.length > 0) {
        const obrasContainer = document.createElement("div");
        obrasRelacionadas.forEach((obraDoc) => {
          const obraData = obraDoc.data();
          const obraId = obraDoc.id;
          console.log(`Rendering obra relacionada ${obraId}:`, obraData);
          const obraDiv = document.createElement("div");
          obraDiv.className = "obra-item";
          obraDiv.innerHTML = `${obraData.endereco || "Obra sem endereço"}`;
          obrasContainer.appendChild(obraDiv);
        });
        tdObras.appendChild(obrasContainer);
      } else {
        tdObras.textContent = "Nenhuma obra relacionada";
      }
      tr.appendChild(tdObras);

      const tdStatus = document.createElement("td");
      tdStatus.textContent = empresaData.status ? empresaData.status.charAt(0).toUpperCase() + empresaData.status.slice(1) : "Ativa";
      tr.appendChild(tdStatus);

      const tdAcoes = document.createElement("td");
      tdAcoes.innerHTML = `<a href="#" onclick="redirecionarParaMenuEmpresa('${empresaId}')">Ver</a>`;
      tr.appendChild(tdAcoes);

      empresasListElement.appendChild(tr);
    });
  } catch (error) {
    console.error("Erro ao carregar empresas:", error);
    empresasListElement.innerHTML = `<tr><td colspan='4'>Erro ao carregar empresas: ${error.message}</td></tr>`;
  }
}

// Carrega o CSS com base no tipo de usuário
function loadCSSForRole() {
  console.log("Carregando CSS padrão para todas as roles");

  const link = document.createElement("link");
  link.rel = "stylesheet";
  link.href = "../css/menuEsquerdo.css"; // ou menuSidebar.css, se renomear
  document.head.appendChild(link);

  const global = document.createElement("link");
  global.rel = "stylesheet";
  global.href = "../css/menu.css";
  document.head.appendChild(global);
}


// Monta a sidebar dinamicamente
function setupSidebar(tipo) {
  console.log(`Configurando sidebar para tipo: ${tipo}`);
  const container = document.querySelector(".container");
  if (!container) {
    console.error("Container não encontrado!");
    return;
  }
  const aside = document.createElement("aside");
  aside.classList.add("sidebar");

  // Adiciona classe específica para a role
  const roleClass = tipo === "administrador" ? "role-admin" : tipo === "gestor" ? "role-gestor" : "role-funcionario";

  aside.innerHTML = `
    <div>
      <div class="sidebar-header"><div class="logo">SAEST</div></div>
      <nav class="sidebar-nav"><ul></ul></nav>
    </div>
    <div class="user-profile">
      <div class="user-info">
        <div class="name ${roleClass}">${tipo}</div>
        <div class="email" id="user-email">carregando...</div>
      </div>
    </div>
  `;

  const ul = aside.querySelector("ul");
  const items = tipo === "funcionario"
    ? [
        { text: "Informações", href: "#", icon: "ri-information-line" },
        { text: "Certificações", href: "certificacoes.html", icon: "ri-file-text-line" },
        { text: "Configurações", href: "#", icon: "ri-settings-3-line" }
      ]
    : [
        { text: "Dashboard", href: "menu.html", icon: "ri-home-line" },
        { text: "Construtoras", href: "menuConstrutora.html", icon: "ri-building-line" },
        { text: "Obras", href: "menuObra.html", icon: "ri-building-2-line" },
        { text: "Documentos", href: "menuDocumentosObra.html", icon: "ri-file-list-3-line" },
        { text: "EPIs", href: "epi.html", icon: "ri-shield-check-line" },
        { text: "Configurações", href: "configuracoes.html", icon: "ri-settings-3-line" }
      ];

  items.forEach((item, index) => {
    const li = document.createElement("li");
    const iconClass = item.icon || "ri-question-line"; // Fallback para ícone genérico
    li.innerHTML = `<a href="${item.href}"><i class="${iconClass}"></i> ${item.text}</a>`;
    if (index === 0) li.classList.add("active");
    ul.appendChild(li);
  });

  container.appendChild(aside);
}

// Carrega os dados do dashboard (Firestore)
async function carregarDadosDashboard() {
  try {
    const usersSnapshot = await getDocs(collection(db, "users"));
    const empresasSnapshot = await getDocs(collection(db, "empresas"));
    const obrasSnapshot = await getDocs(collection(db, "obras"));
    const episSnapshot = await getDocs(collection(db, "epis"));

    // Contadores nos cards
    setTimeout(() => {
      document.getElementById("users-list").textContent = usersSnapshot.size;
      document.getElementById("empresas-list").textContent = empresasSnapshot.size;
      document.getElementById("obras-list").textContent = obrasSnapshot.size;
      document.getElementById("epis-list").textContent = episSnapshot.size;

      document.querySelectorAll(".change-text").forEach((el) => {
        el.textContent = Math.floor(Math.random() * 15) + 5 + "% no último mês";
      });
    }, 800);

    // Renderizando detalhes
    await fetchAndRenderData(
      "users",
      "users-details-list",
      (data) => data.username || "N/A"
    );
    await renderEmpresasTable();
    await fetchAndRenderData(
      "obras",
      "obras-details-list",
      (data) => `Endereço: ${data.endereco || "N/A"}, Responsável Técnico: ${data.responsavel_tecnico || data.responsavelTecnico || "N/A"}, Status: ${data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "Ativa"}`
    );
    await fetchAndRenderData(
      "epis",
      "epis-details-list",
      (data) => `Tipo: ${data.tipo || "N/A"}, Obra: ${data.obraId || "N/A"}, Quantidade: ${data.quantidade || "N/A"}, Status: ${data.disponibilidade || "N/A"}`
    );
  } catch (erro) {
    console.error("Erro ao carregar dados do dashboard:", erro.message);
    const usersList = document.getElementById("users-details-list");
    const empresasList = document.getElementById("empresas-details-list");
    const obrasList = document.getElementById("obras-details-list");
    const episList = document.getElementById("epis-details-list");
    if (usersList) usersList.innerHTML = "Erro ao carregar usuários: " + erro.message;
    if (empresasList) empresasList.innerHTML = "Erro ao carregar empresas: " + erro.message;
    if (obrasList) obrasList.innerHTML = "Erro ao carregar obras: " + erro.message;
    if (episList) episList.innerHTML = `<tr><td colspan='5'>Erro ao carregar EPIs: ${erro.message}</td></tr>`;
  }
}

// Interface para admin/gestor
async function renderConteudoAdminGestor() {
  const main = document.createElement("main");
  main.className = "main-content admin-dashboard"; // Adiciona classe admin-dashboard
  main.innerHTML = `
    <header class="main-header"><i class="ri-notification-3-line"></i></header>
    <section class="stats-container">
      <div class="stat-card"><div class="stat-icon"><i class="ri-group-line"></i></div><div class="stat-content"><h3>Usuários</h3><p id="users-list">0</p></div></div>
      <div class="stat-card"><div class="stat-icon"><i class="ri-building-line"></i></div><div class="stat-content"><h3>Construtoras</h3><p id="empresas-list">0</p></div></div>
      <div class="stat-card"><div class="stat-icon"><i class="ri-building-2-line"></i></div><div class="stat-content"><h3>Obras</h3><p id="obras-list">0</p></div></div>
      <div class="stat-card"><div class="stat-icon"><i class="ri-shield-check-line"></i></div><div class="stat-content"><h3>EPIs</h3><p id="epis-list">0</p></div></div>
    </section>
    <section class="section"><div class="section-header"><h2>Construtoras</h2></div><table><thead><tr><th>Construtora</th><th>Obras</th><th>Status</th><th>Ações</th></tr></thead><tbody id="empresas-details-list"></tbody></table></section>
    <section class="section"><div class="section-header"><h2>Obras</h2></div><table><thead><tr><th>Endereço</th><th>Responsável</th><th>Status</th><th>Ações</th></tr></thead><tbody id="obras-details-list"></tbody></table></section>
    <section class="section"><div class="section-header"><h2>EPIs</h2></div><table><thead><tr><th>Tipo</th><th>Obra</th><th>Qtd</th><th>Status</th><th>Ações</th></tr></thead><tbody id="epis-details-list"></tbody></table></section>
    <section class="section"><div class="section-header"><h2>Usuários</h2></div><div id="users-details-list"></div></section>
  `;
  document.querySelector(".container").appendChild(main);
  await carregarDadosDashboard();
}

// Interface para funcionário
function renderConteudoFuncionario() {
  const main = document.createElement("main");
  main.className = "main-content";
  main.innerHTML = `
    <header class="main-header"><i class="ri-notification-3-line"></i></header>
    <section class="details">
      <h2>Informações</h2>
      <p>Bem-vindo! Aqui você pode acessar suas certificações e dados pessoais.</p>
    </section>
  `;
  document.querySelector(".container").appendChild(main);
}

// Inicializa o conteúdo com base no tipo do usuário
async function initInterface(user, userData) {
  console.log("Dados do usuário recebidos:", userData);
  const tipo = userData.tipo ? String(userData.tipo).toLowerCase().trim() : "funcionario";
  console.log(`Tipo de usuário normalizado: ${tipo}`);

  loadCSSForRole(tipo);
  setupSidebar(tipo);

  if (tipo === "funcionario") {
    console.log("Renderizando interface de funcionário");
    renderConteudoFuncionario();
  } else if (tipo === "administrador" || tipo === "gestor") {
    console.log("Renderizando interface de administrador/gestor");
    await renderConteudoAdminGestor();
  } else {
    console.warn("Tipo de usuário desconhecido:", tipo);
    renderConteudoFuncionario();
  }

  const emailField = document.getElementById("user-email");
  if (emailField) {
    emailField.textContent = user.email || "email@não.disponível";
    console.log("Email atualizado na sidebar:", user.email);
  } else {
    console.error("Elemento user-email não encontrado!");
  }
}

// Verifica autenticação e inicia a renderização
onAuthStateChanged(auth, async (user) => {
  if (user) {
    console.log("Usuário logado:", user.uid, user.email);
    try {
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Dados do documento do usuário:", userData);
        await initInterface(user, userData);
      } else {
        console.warn("Documento do usuário não encontrado, usando padrão funcionário");
        await initInterface(user, { tipo: "funcionario" });
      }
    } catch (e) {
      console.error("Erro ao carregar dados do usuário:", e);
      await initInterface(user, { tipo: "funcionario" });
    }
  } else {
    console.log("Usuário não está logado, redirecionando para login.html");
    redirecionarParaLogin();
  }
});