import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

import { 
    redirecionarParaEditarEmpresa, 
    redirecionarParaEditarObra 
} from "./redirecionar.js";

function formatCriadoEm(data) {
    return data.criadoEm && typeof data.criadoEm.toDate === "function" 
        ? data.criadoEm.toDate().toLocaleString() 
        : "Data não disponível";
}

function createRemoveButton(collectionName, docId, identifier, refreshCallback) {
    const removeBtn = document.createElement("button");
    removeBtn.textContent = "Remover";
    removeBtn.style.marginLeft = "10px";
    removeBtn.addEventListener("click", async () => {
        const confirmDelete = confirm(`Tem certeza que deseja remover ${collectionName} com ${identifier}?`);
        if (confirmDelete) {
            try {
                await deleteDoc(doc(db, collectionName, docId));
                console.log(`${collectionName} ${docId} removido com sucesso`);
                await refreshCallback();
            } catch (error) {
                console.error(`Erro ao remover ${collectionName}:`, error);
                alert(`Erro ao remover ${collectionName}: ${error.message}`);
            }
        }
    });
    return removeBtn;
}

function createEditButton(collectionName, docId, data) {
    const editBtn = document.createElement("button");
    editBtn.textContent = "Editar";
    editBtn.style.marginLeft = "10px";
    editBtn.addEventListener("click", () => {
        localStorage.setItem('editData', JSON.stringify({
            collectionName,
            docId,
            data
        }));

        if (collectionName === "empresas") {
            redirecionarParaEditarEmpresa();
        } else if (collectionName === "obras") {
            redirecionarParaEditarObra();
        }
    });
    return editBtn;
}

async function fetchAndRenderMenuData(collectionName, listId, renderFields, identifierField) {
    const listElement = document.getElementById(listId);
    console.log(`Elemento ${listId}:`, listElement);
    if (!listElement) {
        console.error(`Elemento ${listId} não encontrado!`);
        return { element: null, error: true };
    }
    listElement.innerHTML = ""; 

    const coll = collection(db, collectionName);
    console.log(`Coleção de ${collectionName} obtida:`, coll);
    const snapshot = await getDocs(coll);
    console.log(`Snapshot de ${collectionName} obtido, número de documentos:`, snapshot.size);

    if (snapshot.empty) {
        console.log(`Nenhum ${collectionName} encontrado no snapshot`);
        listElement.innerHTML = `Nenhum ${collectionName} encontrado.`;
    } else {
        console.log(`${collectionName} encontrados:`, snapshot.size);
        snapshot.forEach((docSnapshot) => {
            const data = docSnapshot.data();
            console.log(`Dados do ${collectionName}:`, data);
            const p = document.createElement("p");
            const criadoEm = formatCriadoEm(data);
            p.textContent = renderFields(data, criadoEm);
            
            const identifier = `${identifierField}: ${data[identifierField] || "N/A"}`;
            const removeBtn = createRemoveButton(collectionName, docSnapshot.id, identifier, loadData);
            p.appendChild(removeBtn);

            if (collectionName === "empresas" || collectionName === "obras") {
                const editBtn = createEditButton(collectionName, docSnapshot.id, data);
                p.appendChild(editBtn);
            }
            
            listElement.appendChild(p);
        });
    }
    return { element: listElement, error: false };
}

async function loadData() {
    try {
        console.log("Iniciando loadData...");
        const usersResult = await fetchAndRenderMenuData(
            "users",
            "users-list",
            (data, criadoEm) => `Email: ${data.email || "N/A"}, Nome: ${data.username || "N/A"}, Criado Em: ${criadoEm}`,
            "email"
        );
        const empresasResult = await fetchAndRenderMenuData(
            "empresas",
            "empresas-list",
            (data, criadoEm) => `Nome: ${data.nome || "N/A"}, CNPJ: ${data.cnpj || "N/A"}, Email: ${data.email || "N/A"}, Telefone: ${data.telefone || "N/A"}, Criado Em: ${criadoEm}`,
            "nome"
        );

        const obrasResult = await fetchAndRenderMenuData(
            "obras",
            "obras-list",
            (data, criadoEm) => `Endereço: ${data.endereco || "N/A"}, Alvará: ${data.alvara || "N/A"}, Registro CREA: ${data.registro_crea || "N/A"}, Registro CAL: ${data.registro_cal || "N/A"}, Responsável Técnico: ${data.responsavel_tecnico || "N/A"}, Criado Em: ${criadoEm}`,
            "endereco"
        );

        if (usersResult.error || empresasResult.error || obrasResult.error) {
            return;
        }

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        const usersList = document.getElementById("users-list");
        const empresasList = document.getElementById("empresas-list");
        const obrasList = document.getElementById("obras-list");
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
    if (!user) {
        window.location.href = "login.html";
    } else {
        console.log("Usuário logado:", user.uid);
        await loadData();
    }
});