// O menu.js gerencia um dashboard que exibe e manipula dados de usuários, construtoras e obras;
// monitora o estado de autenticação, carrega dados de coleções, renderiza uma tabela de empresas com obras relacionadas;
// suporta navegação para outras páginas. Logs de depuração rastreiam o carregamento e erros.
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    redirecionarParaLogin,
    redirecionarParaCadastroUser,
    redirecionarParaCadastroEmpresa,
    redirecionarParaCadastroObra,
    redirecionarParaMenuEmpresa
} from "./redirecionar.js";

// Expondo funções de redirecionamento no objeto window para uso global
window.redirecionarParaLogin = redirecionarParaLogin;
window.redirecionarParaCadastroUser = redirecionarParaCadastroUser;
window.redirecionarParaCadastroEmpresa = redirecionarParaCadastroEmpresa;
window.redirecionarParaCadastroObra = redirecionarParaCadastroObra;
window.gerarRelatorio = function () {
    console.log("Relatório gerado");
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
            // Renderizar tabela de obras
            snapshot.forEach((docSnapshot) => {
                const data = docSnapshot.data();
                const obraId = docSnapshot.id;
                console.log(`Rendering obra ${obraId}:`, data);
                console.log(`responsavel_tecnico:`, data.responsavel_tecnico);
                console.log(`responsavelTecnico:`, data.responsavelTecnico);
                const tr = document.createElement("tr");

                // Coluna: Endereço da Obra
                const tdEndereco = document.createElement("td");
                tdEndereco.textContent = data.endereco || "N/A";
                tr.appendChild(tdEndereco);

                // Coluna: Responsável Técnico
                const tdResponsavel = document.createElement("td");
                tdResponsavel.textContent = data.responsavel_tecnico || data.responsavelTecnico || "N/A";
                tr.appendChild(tdResponsavel);

                // Coluna: Status
                const tdStatus = document.createElement("td");
                tdStatus.textContent = data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "Ativa";
                tr.appendChild(tdStatus);

                // Coluna: Ações
                const tdAcoes = document.createElement("td");
                tdAcoes.innerHTML = `
                    <button onclick="redirecionarParaDetalhesObra('${obraId}')">Mais Detalhes</button>
                `;
                tr.appendChild(tdAcoes);

                listElement.appendChild(tr);
            });
        } else if (collectionName === "epis") {
            // Renderizar tabela de EPIs
            const obrasSnapshot = await getDocs(collection(db, "obras"));
            snapshot.forEach((docSnapshot) => {
                const epiData = docSnapshot.data();
                const epiId = docSnapshot.id;
                console.log(`Rendering EPI ${epiId}:`, epiData);
                const obra = obrasSnapshot.docs.find(obraDoc => obraDoc.id === epiData.obraId);
                const tr = document.createElement("tr");

                // Coluna: Tipo de EPI
                const tdTipo = document.createElement("td");
                tdTipo.textContent = epiData.tipo || "N/A";
                tr.appendChild(tdTipo);

                // Coluna: Obra Associada
                const tdObra = document.createElement("td");
                tdObra.textContent = obra ? (obra.data().nome || obra.data().endereco || "Obra sem nome") : "Não especificada";
                tr.appendChild(tdObra);

                // Coluna: Quantidade
                const tdQuantidade = document.createElement("td");
                tdQuantidade.textContent = epiData.quantidade || "N/A";
                tr.appendChild(tdQuantidade);

                // Coluna: Status
                const tdStatus = document.createElement("td");
                tdStatus.textContent = epiData.disponibilidade ? epiData.disponibilidade : "N/A";
                tr.appendChild(tdStatus);

                // Coluna: Ações
                const tdAcoes = document.createElement("td");
                tdAcoes.innerHTML = `
                    <button onclick="redirecionarParaDetalhesEpi('${epiId}')">Mais Detalhes</button>
                `;
                tr.appendChild(tdAcoes);

                listElement.appendChild(tr);
            });
        } else {
            // Renderização padrão para outras coleções
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
        // Buscar todas as empresas
        const empresasSnapshot = await getDocs(collection(db, "empresas"));
        // Buscar todas as obras
        const obrasSnapshot = await getDocs(collection(db, "obras"));

        if (empresasSnapshot.empty) {
            empresasListElement.innerHTML = "<tr><td colspan='4'>Nenhuma construtora encontrada.</td></tr>";
            return;
        }

        // Para cada empresa, contar obras relacionadas e exibir status
        empresasSnapshot.forEach((docSnapshot) => {
            const empresaData = docSnapshot.data();
            const empresaId = docSnapshot.id;
            console.log(`Rendering empresa ${empresaId}:`, empresaData);

            // Filtra obras relacionadas à empresa
            const obrasRelacionadas = obrasSnapshot.docs.filter(
                (obraDoc) => obraDoc.data().empresaId === empresaId
            );

            // Criar linha da tabela
            const tr = document.createElement("tr");

            // Coluna: Construtora
            const tdConstrutora = document.createElement("td");
            tdConstrutora.textContent = empresaData.razaoSocial || "Nome não disponível";
            tr.appendChild(tdConstrutora);

            // Coluna: Obras Relacionadas
            const tdObras = document.createElement("td");
            if (obrasRelacionadas.length > 0) {
                const obrasContainer = document.createElement("div");
                obrasRelacionadas.forEach((obraDoc) => {
                    const obraData = obraDoc.data();
                    const obraId = obraDoc.id;
                    console.log(`Rendering obra relacionada ${obraId}:`, obraData);
                    const obraDiv = document.createElement("div");
                    obraDiv.className = "obra-item";
                    obraDiv.innerHTML = `
                        ${obraData.endereco} 
                        (<span class="obra-status" data-obra-id="${obraId}">${obraData.status ? obraData.status.charAt(0).toUpperCase() + obraData.status.slice(1) : "Ativa"}</span>)
                    `;
                    obrasContainer.appendChild(obraDiv);
                });
                tdObras.appendChild(obrasContainer);
            } else {
                tdObras.textContent = "Nenhuma obra relacionada";
            }
            tr.appendChild(tdObras);

            // Coluna: Status
            const tdStatus = document.createElement("td");
            tdStatus.textContent = empresaData.status ? empresaData.status.charAt(0).toUpperCase() + empresaData.status.slice(1) : "Ativa";
            tr.appendChild(tdStatus);

            // Coluna: Ações
            const tdAcoes = document.createElement("td");
            tdAcoes.innerHTML = `
                <button onclick="redirecionarParaMenuEmpresa('${empresaId}')">Mais Detalhes</button>
            `;
            tr.appendChild(tdAcoes);

            empresasListElement.appendChild(tr);
        });
    } catch (error) {
        console.error("Erro ao carregar empresas:", error);
        empresasListElement.innerHTML = `<tr><td colspan='4'>Erro ao carregar empresas: ${error.message}</td></tr>`;
    }
}

async function loadData() {
    try {
        console.log("Iniciando loadData...");

        const usersSnapshot = await getDocs(collection(db, "users"));
        const empresasSnapshot = await getDocs(collection(db, "empresas"));
        const obrasSnapshot = await getDocs(collection(db, "obras"));
        const episSnapshot = await getDocs(collection(db, "epis"));

        // Atualizando contadores nos cards com IDs
        setTimeout(() => {
            const usersListElement = document.getElementById("users-list");
            const empresasListElement = document.getElementById("empresas-list");
            const obrasListElement = document.getElementById("obras-list");
            const episListElement = document.getElementById("epis-list");

            if (usersListElement) usersListElement.textContent = usersSnapshot.size;
            if (empresasListElement) empresasListElement.textContent = empresasSnapshot.size;
            if (obrasListElement) obrasListElement.textContent = obrasSnapshot.size;
            if (episListElement) episListElement.textContent = episSnapshot.size;

            document.querySelectorAll(".change-text").forEach((el) => {
                el.textContent = Math.floor(Math.random() * 15) + 5 + "% no último mês";
            });
        }, 800);

        // Renderizando detalhes
        const usersResult = await fetchAndRenderData(
            "users",
            "users-details-list",
            (data) => data.username || "N/A"
        );
        await renderEmpresasTable();
        const obrasResult = await fetchAndRenderData(
            "obras",
            "obras-details-list",
            (data) => `Endereço: ${data.endereco || "N/A"}, Responsável Técnico: ${data.responsavel_tecnico || data.responsavelTecnico || "N/A"}, Status: ${data.status ? data.status.charAt(0).toUpperCase() + data.status.slice(1) : "Ativa"}`
        );
        const episResult = await fetchAndRenderData(
            "epis",
            "epis-details-list",
            (data) => `Tipo: ${data.tipo || "N/A"}, Obra: ${data.obraId || "N/A"}, Quantidade: ${data.quantidade || "N/A"}, Status: ${data.disponibilidade || "N/A"}`
        );

        if (usersResult.error || obrasResult.error || episResult.error) {
            return;
        }

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        const usersList = document.getElementById("users-details-list");
        const empresasList = document.getElementById("empresas-details-list");
        const obrasList = document.getElementById("obras-details-list");
        const episList = document.getElementById("epis-details-list");
        if (usersList) {
            usersList.innerHTML = "Erro ao carregar usuários: " + error.message;
        }
        if (empresasList) {
            empresasList.innerHTML = "Erro ao carregar empresas: " + error.message;
        }
        if (obrasList) {
            obrasList.innerHTML = "Erro ao carregar obras: " + error.message;
        }
        if (episList) {
            episList.innerHTML = `<tr><td colspan='5'>Erro ao carregar EPIs: ${error.message}</td></tr>`;
        }
    }
}

// Monitora estado de autenticação do usuário
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userNameElement = document.querySelector(".user-info .name");
        const userEmailElement = document.querySelector(".user-info .email");

        if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
        if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";

        console.log("Usuário logado:", user.uid);
        await loadData();
    } else {
        console.log("Usuário não está logado, redirecionando para login.html");
        window.location.href = "login.html";
    }
});

// Configura link de navegação para menu construtora
document.addEventListener('DOMContentLoaded', () => {
    const construtorasLink = document.querySelector('.construtoras-link');
    if (construtorasLink) {
        console.log("Construtoras link encontrado");
        construtorasLink.addEventListener('click', (e) => {
            e.preventDefault();
            redirecionarParaMenuEmpresa();
        });
    } else {
        console.error("Construtoras link não encontrado!");
    }
});

// Função para redirecionar para detalhes da obra
window.redirecionarParaDetalhesObra = function (obraId) {
    console.log(`Redirecionando para detalhes da obra: ${obraId}`);
    // Implementar redirecionamento real, e.g., window.location.href = `detalhesObra.html?id=${obraId}`;
};

// Função para redirecionar para detalhes do EPI (placeholder)
window.redirecionarParaDetalhesEpi = function (epiId) {
    console.log(`Redirecionando para detalhes do EPI: ${epiId}`);
    window.location.href = `epi.html`; // Redireciona para a página de EPIs
};