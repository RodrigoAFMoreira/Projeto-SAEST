import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    redirecionarParaCadastroObra,
    redirecionarParaMenu
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');

    const sidebarItems = sidebar.querySelectorAll('li:not(.dashboard-link)');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    const dashboardLink = document.querySelector('.dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', () => {
            redirecionarParaMenu();
        });
    }

    const btnCadastrarObra = document.querySelector('.btn.primary');
    if (btnCadastrarObra) {
        btnCadastrarObra.addEventListener('click', redirecionarParaCadastroObra);
    }

    async function renderObrasTable() {
        const lista = document.getElementById('obra-lista');
        if (!lista) {
            console.error("Elemento obra-lista não encontrado!");
            return;
        }
        lista.innerHTML = "";

        try {
            const obrasSnapshot = await getDocs(collection(db, "obras"));
            const empresasSnapshot = await getDocs(collection(db, "empresas"));

            if (obrasSnapshot.empty) {
                lista.innerHTML = '<tr><td colspan="3">Nenhuma obra encontrada.</td></tr>';
                return;
            }

            obrasSnapshot.forEach((obraDoc) => {
                const obraData = obraDoc.data();
                const empresa = empresasSnapshot.docs.find(
                    (empresaDoc) => empresaDoc.id === obraData.empresaId
                );
                const empresaNome = empresa ? empresa.data().razaoSocial : "Empresa não encontrada";

                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${obraData.endereco || "Sem endereço"}</td>
                    <td>${empresaNome}</td>
                    <td>
                        <button title="Editar"><i class="ri-edit-line"></i></button>
                        <button title="Expandir"><i class="ri-arrow-down-s-line"></i></button>
                        <button title="Deletar"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                lista.appendChild(tr);
            });
        } catch (error) {
            console.error("Erro ao carregar obras:", error);
            lista.innerHTML = `<tr><td colspan="3">Erro ao carregar obras: ${error.message}</td></tr>`;
        }
    }

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userNameElement = document.querySelector(".user-profile .name");
            const userEmailElement = document.querySelector(".user-profile .email");
            if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
            if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
            await renderObrasTable();
        } else {
            window.location.href = "login.html";
        }
    });
});
