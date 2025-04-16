import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
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

async function fetchAndRenderData(collectionName, listId, renderFields, identifierField) {
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
            listElement.appendChild(p);
        });
    }
    return { element: listElement, error: false };
}

async function loadData() {
    try {
        console.log("Iniciando loadData...");

        const usersCount = (await getDocs(collection(db, "users"))).size;
        const empresasCount = (await getDocs(collection(db, "empresas"))).size;
        const obrasCount = (await getDocs(collection(db, "obras"))).size;

        setTimeout(() => {
            document.getElementById("users-list").textContent = usersCount;
            document.querySelector(".stat-card:nth-child(2) .value").textContent = empresasCount;
            document.getElementById("obras-list").textContent = obrasCount;
            document.querySelectorAll(".change-text").forEach((el) => {
                el.textContent = Math.floor(Math.random() * 15) + 5 + "% no último mês";
            });
        }, 800);

        const usersResult = await fetchAndRenderData(
            "users",
            "users-details-list", 
            (data, criadoEm) => `Email: ${data.email || "N/A"}, Nome: ${data.username || "N/A"}, Criado Em: ${criadoEm}`,
            "email"
        );
        const empresasResult = await fetchAndRenderData(
            "empresas",
            "empresas-list",
            (data, criadoEm) => `Razão Social: ${data.razaoSocial || "N/A"}, Nome Fantasia: ${data.nomeFantasia || "N/A"}, Email: ${data.email || "N/A"}, Porte: ${data.porte || "N/A"}, Telefone: ${data.telefone || "N/A"}, Criado Em: ${criadoEm}`,
            "razaoSocial"
        );
        const obrasResult = await fetchAndRenderData(
            "obras",
            "obras-details-list", 
            (data, criadoEm) => `Endereço: ${data.endereco || "N/A"}, Alvará: ${data.alvara || "N/A"}, Registro CREA: ${data.registro_crea || "N/A"}, Registro CAL: ${data.registro_cal || "N/A"}, Responsável Técnico: ${data.responsavel_tecnico || "N/A"}, Criado Em: ${criadoEm}`,
            "endereco"
        );

        if (usersResult.error || empresasResult.error || obrasResult.error) {
            return;
        }

    } catch (error) {
        console.error("Erro ao buscar dados:", error);
        const usersList = document.getElementById("users-details-list");
        const empresasList = document.getElementById("empresas-list");
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
        
        userNameElement.textContent = user.displayName || "Usuário";
        userEmailElement.textContent = user.email || "email@não.disponível";
        
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
      console.log("Construtoras link found:", construtorasLink);
      construtorasLink.addEventListener('click', (e) => {
          e.preventDefault();
          console.log("Construtoras link clicked, redirecting to menuempresa.html");
          redirecionarParaMenuEmpresa();
      });
  } else {
      console.error("Construtoras link not found!");
  }
}); 