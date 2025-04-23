import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    redirecionarParaCadastroObra,
    redirecionarParaMenu,
    redirecionarParaMenuEmpresa,
    redirecionarParaObras,
    redirecionarParaEditarObra
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');

    // Configurar toggle da sidebar
    const sidebarItems = sidebar.querySelectorAll('li:not(.dashboard-link)');
    sidebarItems.forEach(item => {
        item.addEventListener('click', () => {
            if (window.innerWidth <= 768) {
                sidebar.classList.remove('active');
            }
        });
    });

    // Redirecionamento para Dashboard
    const dashboardLink = document.querySelector('.dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', () => {
            console.log("Dashboard link clicked, redirecting to menu.html");
            redirecionarParaMenu();
        });
    } else {
        console.error("Dashboard link not found!");
    }

    // Redirecionamento para Empresas
    const empresasLink = document.querySelector('.empresas-link');
    if (empresasLink) {
        empresasLink.addEventListener('click', () => {
            console.log("Empresas link clicked, redirecting to menuEmpresa.html");
            redirecionarParaMenuEmpresa();
        });
    } else {
        console.error("Empresas link not found!");
    }

    // Redirecionamento para Obras
    const obrasLink = document.querySelector('.obras-link');
    if (obrasLink) {
        obrasLink.addEventListener('click', (event) => {
            console.log("Obras link clicked, redirecting to menuObra.html");
            event.stopPropagation();
            redirecionarParaObras();
        });
    } else {
        console.error("Obras link not found!");
    }

    // Redirecionamento para Configurações (placeholder)
    const configuracoesLink = document.querySelector('.configuracoes-link');
    if (configuracoesLink) {
        configuracoesLink.addEventListener('click', () => {
            console.log("Configurações link clicked, no redirect defined");
        });
    } else {
        console.error("Configurações link not found!");
    }

    // Configurar botão Cadastrar Obra
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
        lista.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

        try {
            const obrasSnapshot = await getDocs(collection(db, "obras"));
            const empresasSnapshot = await getDocs(collection(db, "empresas"));

            if (obrasSnapshot.empty) {
                lista.innerHTML = '<tr><td colspan="3">Nenhuma obra encontrada.</td></tr>';
                return;
            }

            obrasSnapshot.forEach((obraDoc) => {
                const obraData = obraDoc.data();
                const obraId = obraDoc.id;
                const empresa = empresasSnapshot.docs.find(
                    (empresaDoc) => empresaDoc.id === obraData.empresaId
                );
                const empresaNome = empresa ? empresa.data().razaoSocial : "Empresa não encontrada";

                const escapedEndereco = (obraData.endereco || "Sem endereço").replace(/'/g, "\\'");

                const tr = document.createElement('tr');
                tr.setAttribute('data-id', obraId);
                tr.innerHTML = `
                    <td>${obraData.endereco || "Sem endereço"}</td>
                    <td>${empresaNome}</td>
                    <td>
                        <button title="Editar" onclick="editObra('${obraId}', '${escapedEndereco}')"><i class="ri-edit-line"></i></button>
                        <button title="Expandir" class="expand-btn" data-id="${obraId}"><i class="ri-arrow-down-s-line"></i></button>
                        <button title="Deletar" onclick="deleteObra('${obraId}', '${escapedEndereco}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                lista.appendChild(tr);

                const expandBtn = tr.querySelector('.expand-btn');
                expandBtn.addEventListener('click', () => toggleExpandRow(obraId, obraData, expandBtn));
            });

            // Add styles for expanded row
            const style = document.createElement('style');
            style.textContent = `
                .expanded-details {
                    background: #f9f9f9;
                    padding: 15px;
                    border-top: 1px solid #ddd;
                }
                .expanded-details p {
                    margin: 5px 0;
                }
                .expanded-row td {
                    padding: 0 !important;
                }
            `;
            document.head.appendChild(style);
        } catch (error) {
            console.error("Erro ao carregar obras:", error);
            lista.innerHTML = `<tr><td colspan="3">Erro ao carregar obras: ${error.message}</td></tr>`;
        }
    }

    function toggleExpandRow(obraId, obraData, expandBtn) {
        const row = document.querySelector(`tr[data-id="${obraId}"]`);
        const existingExpandedRow = row.nextElementSibling;

        // Close other expanded rows
        document.querySelectorAll('.expanded-row').forEach((expandedRow) => {
            if (expandedRow !== existingExpandedRow) {
                expandedRow.remove();
                const otherBtn = document.querySelector(`.expand-btn[data-id="${expandedRow.dataset.id}"] i`);
                if (otherBtn) otherBtn.className = 'ri-arrow-down-s-line';
            }
        });

        if (existingExpandedRow && existingExpandedRow.classList.contains('expanded-row')) {
            existingExpandedRow.remove();
            expandBtn.querySelector('i').className = 'ri-arrow-down-s-line';
        } else {
            const expandedRow = document.createElement('tr');
            expandedRow.classList.add('expanded-row');
            expandedRow.dataset.id = obraId;
            expandedRow.innerHTML = `
                <td colspan="3">
                    <div class="expanded-details">
                        <p><strong>Endereço:</strong> ${obraData.endereco || 'N/A'}</p>
                        <p><strong>Status:</strong> ${obraData.status || 'N/A'}</p>
                        <p><strong>Data de Início:</strong> ${obraData.dataInicio || 'N/A'}</p>
                        <p><strong>Data de Término:</strong> ${obraData.dataTermino || 'N/A'}</p>
                        <p><strong>Responsável Técnico:</strong> ${obraData.responsavelTecnico || 'N/A'}</p>
                    </div>
                </td>
            `;
            row.insertAdjacentElement('afterend', expandedRow);
            expandBtn.querySelector('i').className = 'ri-arrow-up-s-line';
        }
    }

    window.editObra = async function(obraId, endereco) {
        try {
            const obraRef = doc(db, "obras", obraId);
            const obraDoc = await getDoc(obraRef);
            if (obraDoc.exists()) {
                const obraData = obraDoc.data();
                localStorage.setItem('editData', JSON.stringify({
                    collectionName: "obras",
                    docId: obraId,
                    data: {
                        endereco: obraData.endereco || '',
                        status: obraData.status || '',
                        dataInicio: obraData.dataInicio || '',
                        dataTermino: obraData.dataTermino || '',
                        responsavelTecnico: obraData.responsavelTechnico || '', // Added
                        empresaId: obraData.empresaId || ''
                    }
                }));
                console.log(`Dados da obra ${endereco} armazenados no localStorage:`, obraData);
                redirecionarParaEditarObra();
            } else {
                console.error(`Obra com ID ${obraId} não encontrada!`);
                alert("Erro: Obra não encontrada para edição.");
            }
        } catch (error) {
            console.error("Erro ao buscar dados da obra para edição:", error);
            alert(`Erro ao preparar edição: ${error.message}`);
        }
    };

    window.deleteObra = async function(obraId, endereco) {
        const confirmDelete = confirm(`Tem certeza que deseja remover a obra "${endereco}"?`);
        if (confirmDelete) {
            try {
                await deleteDoc(doc(db, "obras", obraId));
                console.log(`Obra ${obraId} removida com sucesso`);
                await renderObrasTable();
            } catch (error) {
                console.error("Erro ao remover obra:", error);
                alert(`Erro ao remover obra: ${error.message}`);
            }
        }
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userNameElement = document.querySelector(".user-profile .name");
            const userEmailElement = document.querySelector(".user-profile .email");
            if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
            if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
            await renderObrasTable();
        } else {
            console.log("Usuário não está logado, redirecionando para login.html");
            window.location.href = "login.html";
        }
    });
});