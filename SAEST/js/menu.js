import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { 
    redirecionarParaLogin, 
    redirecionarParaMenu, 
    redirecionarParaMenuEmpresa, 
    redirecionarParaObras,
    redirecionarParaConfiguracoes,
    redirecionarParaCadastroUser
} from "./redirecionar.js";

// Sidebar - Redirecionamentos
document.addEventListener('DOMContentLoaded', () => {
    const dashboardLink = document.querySelector('.dashboard-link');
    const empresasLink = document.querySelector('.empresas-link');
    const obrasLink = document.querySelector('.obras-link');
    const configuracoesLink = document.querySelector('.configuracoes-link');

    if (dashboardLink) dashboardLink.addEventListener('click', redirecionarParaMenu);
    if (empresasLink) empresasLink.addEventListener('click', redirecionarParaMenuEmpresa);
    if (obrasLink) obrasLink.addEventListener('click', redirecionarParaObras);
    if (configuracoesLink) configuracoesLink.addEventListener('click', redirecionarParaConfiguracoes);
});

// Abrir modal cadastro usuário
window.abrirModalUsuario = function () {
    redirecionarParaCadastroUser();
};

// Abrir modal editar empresa
window.abrirModalEditarEmpresa = function (empresaId) {
    const modal = document.getElementById('modalEditarEmpresa');
    modal.style.display = 'flex';

    // Simulação de preenchimento (depois você pode buscar dados reais do Firestore se quiser)
    document.getElementById('edit-razao-social').value = "Razão Social Exemplo";
    document.getElementById('edit-nome-fantasia').value = "Nome Fantasia Exemplo";
    document.getElementById('edit-email').value = "exemplo@email.com";
    document.getElementById('edit-porte').value = "Média";
    document.getElementById('edit-telefone').value = "(41) 99999-9999";
};

// Fechar modal editar
window.fecharModalEditar = function () {
    const modal = document.getElementById('modalEditarEmpresa');
    modal.style.display = 'none';
};

// Atualizar informações do usuário logado
onAuthStateChanged(auth, async (user) => {
    if (user) {
        const userNameElement = document.querySelector(".user-profile .name");
        const userEmailElement = document.querySelector(".user-profile .email");

        if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
        if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";

        await loadData();
    } else {
        redirecionarParaLogin();
    }
});

// Carregar dados do dashboard
async function loadData() {
    try {
        const usersSnapshot = await getDocs(collection(db, "users"));
        const empresasSnapshot = await getDocs(collection(db, "empresas"));
        const obrasSnapshot = await getDocs(collection(db, "obras"));

        document.getElementById("users-list").textContent = usersSnapshot.size;
        document.getElementById("empresas-list").textContent = empresasSnapshot.size;
        document.getElementById("obras-list").textContent = obrasSnapshot.size;

        await fetchAndRenderUsers();
        await renderEmpresasTable();
        await fetchAndRenderObras();
    } catch (error) {
        console.error("Erro ao carregar dados:", error);
    }
}

// Buscar usuários
async function fetchAndRenderUsers() {
    const listElement = document.getElementById("users-details-list");
    listElement.innerHTML = "";

    try {
        const snapshot = await getDocs(collection(db, "users"));
        if (snapshot.empty) {
            listElement.innerHTML = "Nenhum usuário encontrado.";
        } else {
            snapshot.forEach((doc) => {
                const p = document.createElement("p");
                p.textContent = doc.data().username || "Usuário sem nome";
                listElement.appendChild(p);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar usuários:", error);
    }
}

// Buscar obras
async function fetchAndRenderObras() {
    const obrasListElement = document.getElementById("obras-details-list");
    obrasListElement.innerHTML = "";

    try {
        const snapshot = await getDocs(collection(db, "obras"));

        if (snapshot.empty) {
            obrasListElement.innerHTML = "<tr><td colspan='4'>Nenhuma obra encontrada.</td></tr>";
            return;
        }

        snapshot.forEach((obraDoc) => {
            const obraData = obraDoc.data();
            const obraId = obraDoc.id;

            const tr = document.createElement("tr");

            // Endereço da Obra
            const tdEndereco = document.createElement("td");
            tdEndereco.textContent = obraData.endereco || "Endereço não disponível";
            tr.appendChild(tdEndereco);

            // Responsável Técnico
            const tdResponsavel = document.createElement("td");
            tdResponsavel.textContent = obraData.responsavel_tecnico || "Responsável não definido";
            tr.appendChild(tdResponsavel);

            // Status (Badge)
            const tdStatus = document.createElement("td");
            const badge = document.createElement("span");
            badge.className = `badge ${obraData.status === "ativo" ? "green" : obraData.status === "inativo" ? "red" : "blue"}`;
            badge.textContent = obraData.status === "ativo" ? "Ativo" : obraData.status === "inativo" ? "Inativo" : "Concluído";
            badge.setAttribute("data-obra-id", obraId);
            tdStatus.appendChild(badge);
            tr.appendChild(tdStatus);

            // Ações (Botões)
            const tdAcoes = document.createElement("td");
            tdAcoes.style.display = "flex";
            tdAcoes.style.gap = "6px";

            // Botão Mudar Status
            const btnToggleStatus = document.createElement("button");
            btnToggleStatus.className = "btn small secondary toggle-status-obra-btn";
            btnToggleStatus.textContent = "Mudar Status";
            btnToggleStatus.setAttribute("data-obra-id", obraId);
            btnToggleStatus.setAttribute("data-current-status", obraData.status || "ativo");
            tdAcoes.appendChild(btnToggleStatus);

            // Botão Editar Obra
            const btnEditarObra = document.createElement("button");
            btnEditarObra.className = "btn small primary edit-obra-btn";
            btnEditarObra.innerHTML = `<i class="ri-pencil-line"></i> Editar`;
            btnEditarObra.setAttribute("data-obra-id", obraId);
            tdAcoes.appendChild(btnEditarObra);

            tr.appendChild(tdAcoes);

            obrasListElement.appendChild(tr);
        });

        // Evento Botão Mudar Status
        document.querySelectorAll(".toggle-status-obra-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                const obraId = button.getAttribute("data-obra-id");
                const currentStatus = button.getAttribute("data-current-status");

                try {
                    const newStatus = await toggleObraStatus(obraId, currentStatus);

                    const badge = document.querySelector(`.badge[data-obra-id="${obraId}"]`);
                    if (badge) {
                        badge.textContent = newStatus === "ativo" ? "Ativo" : newStatus === "inativo" ? "Inativo" : "Concluído";
                        badge.className = `badge ${newStatus === "ativo" ? "green" : newStatus === "inativo" ? "red" : "blue"}`;
                    }

                    button.setAttribute("data-current-status", newStatus);
                } catch (error) {
                    alert("Erro ao mudar status: " + error.message);
                }
            });
        });

        // Evento Botão Editar Obra
        document.querySelectorAll(".edit-obra-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const obraId = button.getAttribute("data-obra-id");
                abrirModalEditarObra(obraId);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar obras:", error);
    }
}


// Atualizar status da obra
async function toggleObraStatus(obraId, currentStatus) {
    try {
        const obraRef = doc(db, "obras", obraId);
        const newStatus = currentStatus === "ativo" ? "inativo" : "ativo";
        await updateDoc(obraRef, { status: newStatus });
        return newStatus;
    } catch (error) {
        console.error("Erro ao atualizar status da obra:", error);
        throw error;
    }
}

// Renderizar empresas e suas obras relacionadas
async function renderEmpresasTable() {
    const empresasListElement = document.getElementById("empresas-details-list");
    empresasListElement.innerHTML = "";

    try {
        const empresasSnapshot = await getDocs(collection(db, "empresas"));
        const obrasSnapshot = await getDocs(collection(db, "obras"));

        if (empresasSnapshot.empty) {
            empresasListElement.innerHTML = "<tr><td colspan='4'>Nenhuma construtora encontrada.</td></tr>";
            return;
        }

        empresasSnapshot.forEach((empresaDoc) => {
            const empresaData = empresaDoc.data();
            const empresaId = empresaDoc.id;

            const obrasRelacionadas = obrasSnapshot.docs.filter(
                (obraDoc) => obraDoc.data().empresaId === empresaId
            );

            obrasRelacionadas.forEach((obraDoc) => {
                const obraData = obraDoc.data();
                const obraId = obraDoc.id;

                const tr = document.createElement("tr");

                // Construtora
                const tdConstrutora = document.createElement("td");
                tdConstrutora.textContent = empresaData.razaoSocial || "Nome não disponível";
                tr.appendChild(tdConstrutora);

                // Obras Relacionadas (apenas o endereço)
                const tdObras = document.createElement("td");
                tdObras.textContent = obraData.endereco || "Endereço não disponível";
                tr.appendChild(tdObras);

                // Status (badge)
                const tdStatus = document.createElement("td");
                const badge = document.createElement("span");
                badge.className = `badge ${obraData.status === "ativo" ? "green" : "red"}`;
                badge.textContent = obraData.status === "ativo" ? "Ativo" : "Inativo";
                badge.setAttribute("data-obra-id", obraId);
                tdStatus.appendChild(badge);
                tr.appendChild(tdStatus);

                // Ações
                const tdAcoes = document.createElement("td");
                tdAcoes.style.display = "flex";
                tdAcoes.style.gap = "6px";

                // Botão Mudar Status
                const btnToggleStatus = document.createElement("button");
                btnToggleStatus.className = "btn small secondary toggle-status-btn";
                btnToggleStatus.textContent = "Mudar Status";
                btnToggleStatus.setAttribute("data-obra-id", obraId);
                btnToggleStatus.setAttribute("data-current-status", obraData.status || "ativo");
                tdAcoes.appendChild(btnToggleStatus);

                // Botão Editar Empresa
                const btnEditarEmpresa = document.createElement("button");
                btnEditarEmpresa.className = "btn small primary edit-empresa-btn";
                btnEditarEmpresa.innerHTML = `<i class="ri-pencil-line"></i> Editar`;
                btnEditarEmpresa.setAttribute("data-empresa-id", empresaId);
                tdAcoes.appendChild(btnEditarEmpresa);

                tr.appendChild(tdAcoes);

                empresasListElement.appendChild(tr);
            });
        });

        // Evento botão mudar status
        document.querySelectorAll(".toggle-status-btn").forEach((button) => {
            button.addEventListener("click", async () => {
                const obraId = button.getAttribute("data-obra-id");
                const currentStatus = button.getAttribute("data-current-status");

                try {
                    const newStatus = await toggleObraStatus(obraId, currentStatus);

                    const badge = document.querySelector(`.badge[data-obra-id="${obraId}"]`);
                    if (badge) {
                        badge.textContent = newStatus === "ativo" ? "Ativo" : "Inativo";
                        badge.className = `badge ${newStatus === "ativo" ? "green" : "red"}`;
                    }

                    button.setAttribute("data-current-status", newStatus);
                } catch (error) {
                    alert("Erro ao mudar status: " + error.message);
                }
            });
        });

        // Evento botão editar empresa
        document.querySelectorAll(".edit-empresa-btn").forEach((button) => {
            button.addEventListener("click", () => {
                const empresaId = button.getAttribute("data-empresa-id");
                abrirModalEditarEmpresa(empresaId);
            });
        });

    } catch (error) {
        console.error("Erro ao carregar empresas:", error);
    }
}
