import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { 
    redirecionarParaLogin, 
    redirecionarParaCadastroUser, 
    redirecionarParaCadastroEmpresa, 
    redirecionarParaCadastroObra,
    redirecionarParaMenuEmpresa
} from "./redirecionar.js";

window.redirecionarParaLogin = redirecionarParaLogin;
window.redirecionarParaCadastroUser = redirecionarParaCadastroUser;
window.redirecionarParaCadastroEmpresa = redirecionarParaCadastroEmpresa;
window.redirecionarParaCadastroObra = redirecionarParaCadastroObra;

window.gerarRelatorio = function () {
    console.log("Relatório gerado");
};

// Função para alternar o status de uma obra no Firestore
async function toggleObraStatus(obraId, currentStatus) {
    try {
        const obraRef = doc(db, "obras", obraId);
        const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
        await updateDoc(obraRef, { status: newStatus });
        console.log(`Status da obra ${obraId} alterado para ${newStatus}`);
        return newStatus;
    } catch (error) {
        console.error("Erro ao atualizar status da obra:", error);
        throw error;
    }
}

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
        listElement.innerHTML = `Nenhum ${collectionName} encontrado.`;
    } else {
        snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            const p = document.createElement("p");
            p.textContent = renderFields(data);
            listElement.appendChild(p);
        });
    }
    return { element: listElement, error: false };
}

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

            // Contar obras relacionadas a esta empresa
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
                    const obraDiv = document.createElement("div");
                    obraDiv.className = "obra-item";
                    obraDiv.innerHTML = `
                        ${obraData.endereco} 
                        (<span class="obra-status" data-obra-id="${obraId}">${obraData.status || "N/A"}</span>)
                        <button class="toggle-status-btn" data-obra-id="${obraId}" data-current-status="${obraData.status || "ativo"}">
                            Mudar Status
                        </button>
                    `;
                    obrasContainer.appendChild(obraDiv);
                });
                tdObras.appendChild(obrasContainer);
            } else {
                tdObras.textContent = "Nenhuma obra relacionada";
            }
            tr.appendChild(tdObras);

            // Coluna: Status (da empresa)
            const tdStatus = document.createElement("td");
            tdStatus.textContent = empresaData.status || "Ativo"; // Ajuste conforme o campo de status da empresa
            tr.appendChild(tdStatus);

            // Coluna: Ações
            const tdAcoes = document.createElement("td");
            tdAcoes.innerHTML = `
                <button onclick="redirecionarParaMenuEmpresa('${empresaId}')">Editar</button>
            `;
            tr.appendChild(tdAcoes);

            empresasListElement.appendChild(tr);
        });

        // Adicionar eventos aos botões de mudar status
        document.querySelectorAll(".toggle-status-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                const obraId = button.getAttribute("data-obra-id");
                const currentStatus = button.getAttribute("data-current-status");

                try {
                    // Alternar status no Firestore
                    const newStatus = await toggleObraStatus(obraId, currentStatus);

                    // Atualizar o texto do status na interface
                    const statusSpan = document.querySelector(`.obra-status[data-obra-id="${obraId}"]`);
                    if (statusSpan) {
                        statusSpan.textContent = newStatus;
                    }

                    // Atualizar o atributo data-current-status do botão
                    button.setAttribute("data-current-status", newStatus);
                } catch (error) {
                    alert("Erro ao alterar o status da obra: " + error.message);
                }
            });
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

        // Atualizando contadores nos cards com IDs
        setTimeout(() => {
            const usersListElement = document.getElementById("users-list");
            const empresasListElement = document.getElementById("empresas-list");
            const obrasListElement = document.getElementById("obras-list");

            if (usersListElement) usersListElement.textContent = usersSnapshot.size;
            if (empresasListElement) empresasListElement.textContent = empresasSnapshot.size;
            if (obrasListElement) obrasListElement.textContent = obrasSnapshot.size;

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
            (data) => `Endereço: ${data.endereco || "N/A"}, Responsável Técnico: ${data.responsavel_tecnico || "N/A"}, Status: ${data.status || "Ativo"}`
        );

        if (usersResult.error || obrasResult.error) {
            return;
        }

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        const usersList = document.getElementById("users-details-list");
        const empresasList = document.getElementById("empresas-details-list");
        const obrasList = document.getElementById("obras-details-list");
        if (usersList) {
            usersList.innerHTML = "Erro ao carregar usuários: " + error.message;
        }
        if (empresasList) {
            empresasList.innerHTML = "Erro ao carregar empresas: " + error.message;
        }
        if (obrasList) {
            obrasList.innerHTML = "Erro ao carregar obras: " + error.message;
        }
    }
}

onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userNameElement = document.querySelector(".sidebar-footer .user-info p:first-child");
        const userEmailElement = document.querySelector(".sidebar-footer .user-info p:last-child");
        
        if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
        if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
        
        console.log("Usuário logado:", user.uid);
        await loadData();
    } else {
        console.log("Usuário não está logado, redirecionando para login.html");
        window.location.href = "login.html";
    }
});

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
