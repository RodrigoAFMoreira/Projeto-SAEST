import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js"; // Added getDoc
import {
    redirecionarParaCadastroEmpresa,
    redirecionarParaCadastroObra,
    redirecionarParaMenu,
    redirecionarParaMenuEmpresa,
    redirecionarParaObras,
    redirecionarParaEditarEmpresa
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const sidebar = document.getElementById('sidebar');

    if (menuToggle && sidebar) {
        menuToggle.addEventListener('click', () => {
            sidebar.classList.toggle('active');
        });

        const sidebarItems = sidebar.querySelectorAll('li:not(.dashboard-link)');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    // Redirecionamento para Dashboard
    const dashboardLink = document.querySelector('.dashboard-link');
    if (dashboardLink) {
        console.log("Dashboard link found:", dashboardLink);
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
        console.log("Empresas link found:", empresasLink);
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
        console.log("Obras link found:", obrasLink);
        obrasLink.addEventListener('click', () => {
            console.log("Obras link clicked, redirecting to menuObra.html");
            redirecionarParaObras();
        });
    } else {
        console.error("Obras link not found!");
    }

    // Redirecionamento para Configurações (placeholder)
    const configuracoesLink = document.querySelector('.configuracoes-link');
    if (configuracoesLink) {
        console.log("Configurações link found:", configuracoesLink);
        configuracoesLink.addEventListener('click', () => {
            console.log("Configurações link clicked, no redirect defined");
        });
    } else {
        console.error("Configurações link not found!");
    }

    // Botão Cadastrar Empresa
    const btnCadastrarEmpresa = document.querySelector('.btn.primary');
    if (btnCadastrarEmpresa) {
        btnCadastrarEmpresa.addEventListener('click', redirecionarParaCadastroEmpresa);
    }

    // Botão Nova Obra
    const btnNovaObra = document.querySelector('.btn.secondary');
    if (btnNovaObra) {
        btnNovaObra.addEventListener('click', redirecionarParaCadastroObra);
    }

    // Botão Go to Obras
    const btnGoToObras = document.getElementById('Para Obras'); // Fixed ID
    if (btnGoToObras) {
        console.log("Go to Obras button found:", btnGoToObras);
        btnGoToObras.addEventListener('click', () => {
            console.log("Go to Obras button clicked, redirecting to menuObra.html");
            redirecionarParaObras();
        });
    } else {
        console.error("Go to Obras button not found!");
    }

    async function renderEmpresasTable() {
        const lista = document.getElementById('empresa-lista');
        if (!lista) {
            console.error("Elemento empresa-lista não encontrado!");
            return;
        }
        lista.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

        try {
            const empresasSnapshot = await getDocs(collection(db, "empresas"));
            const obrasSnapshot = await getDocs(collection(db, "obras"));

            if (empresasSnapshot.empty) {
                lista.innerHTML = '<tr><td colspan="3">Nenhuma empresa encontrada.</td></tr>';
                return;
            }

            empresasSnapshot.forEach((docSnapshot) => {
                const empresaData = docSnapshot.data();
                const empresaId = docSnapshot.id;

                const obrasRelacionadas = obrasSnapshot.docs.filter(
                    (obraDoc) => obraDoc.data().empresaId === empresaId
                );

                const escapedRazaoSocial = (empresaData.razaoSocial || "Nome não disponível").replace(/'/g, "\\'");

                const tr = document.createElement('tr');
                tr.setAttribute('data-id', empresaId);
                tr.innerHTML = `
                    <td>${empresaData.razaoSocial || "Nome não disponível"}</td>
                    <td>${
                        obrasRelacionadas.length > 0
                            ? obrasRelacionadas.map(obraDoc => {
                                  const obraData = obraDoc.data();
                                  return `${obraData.endereco} (Status: ${obraData.status || "ativo"})`;
                              }).join(", ")
                            : "Nenhuma obra relacionada"
                    }</td>
                    <td>
                        <button title="Editar" onclick="editEmpresa('${empresaId}', '${escapedRazaoSocial}')"><i class="ri-edit-line"></i></button>
                        <button title="Expandir" class="expand-btn" data-id="${empresaId}"><i class="ri-arrow-down-s-line"></i></button>
                        <button title="Deletar" onclick="deleteEmpresa('${empresaId}', '${escapedRazaoSocial}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                lista.appendChild(tr);

                const expandBtn = tr.querySelector('.expand-btn');
                expandBtn.addEventListener('click', () => toggleExpandRow(empresaId, empresaData, expandBtn));
            });

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
            console.error("Erro ao carregar empresas:", error);
            lista.innerHTML = `<tr><td colspan="3">Erro ao carregar empresas: ${error.message}</td></tr>`;
        }
    }

    function toggleExpandRow(empresaId, empresaData, expandBtn) {
        const row = document.querySelector(`tr[data-id="${empresaId}"]`);
        const existingExpandedRow = row.nextElementSibling;

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
            expandedRow.dataset.id = empresaId;
            expandedRow.innerHTML = `
                <td colspan="3">
                    <div class="expanded-details">
                        <p><strong>Nome Fantasia:</strong> ${empresaData.nomeFantasia || 'N/A'}</p>
                        <p><strong>E-mail:</strong> ${empresaData.email || 'N/A'}</p>
                        <p><strong>Porte da Empresa:</strong> ${empresaData.porte || 'N/A'}</p>
                        <p><strong>Telefone:</strong> ${empresaData.telefone || 'N/A'}</p>
                        <p><strong>Responsável Técnico:</strong> ${empresaData.responsavelTecnico || 'N/A'}</p>
                    </div>
                </td>
            `;
            row.insertAdjacentElement('afterend', expandedRow);
            expandBtn.querySelector('i').className = 'ri-arrow-up-s-line';
        }
    }

    window.editEmpresa = async function(empresaId, razaoSocial) {
        try {
            const empresaRef = doc(db, "empresas", empresaId);
            const empresaDoc = await getDoc(empresaRef);
            if (empresaDoc.exists()) {
                const empresaData = empresaDoc.data();
                localStorage.setItem('editData', JSON.stringify({
                    collectionName: "empresas",
                    docId: empresaId,
                    data: {
                        razaoSocial: empresaData.razaoSocial || '',
                        nomeFantasia: empresaData.nomeFantasia || '',
                        email: empresaData.email || '',
                        porte: empresaData.porte || '',
                        telefone: empresaData.telefone || '',
                        responsavelTecnico: empresaData.responsavelTecnico || '' // Added
                    }
                }));
                console.log(`Dados da empresa ${razaoSocial} armazenados no localStorage:`, empresaData);
                redirecionarParaEditarEmpresa();
            } else {
                console.error(`Empresa com ID ${empresaId} não encontrada!`);
                alert("Erro: Empresa não encontrada para edição.");
            }
        } catch (error) {
            console.error("Erro ao buscar dados da empresa para edição:", error);
            alert(`Erro ao preparar edição: ${error.message}`);
        }
    };

    window.deleteEmpresa = async function(empresaId, razaoSocial) {
        const confirmDelete = confirm(`Tem certeza que deseja remover a empresa "${razaoSocial}"?`);
        if (confirmDelete) {
            try {
                await deleteDoc(doc(db, "empresas", empresaId));
                console.log(`Empresa ${empresaId} removida com sucesso`);
                await renderEmpresasTable();
            } catch (error) {
                console.error("Erro ao remover empresa:", error);
                alert(`Erro ao remover empresa: ${error.message}`);
            }
        }
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userNameElement = document.querySelector(".user-profile .name");
            const userEmailElement = document.querySelector(".user-profile .email");
            if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
            if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
            console.log("Usuário logado:", user.uid);
            await renderEmpresasTable();
        } else {
            console.log("Usuário não está logado, redirecionando para login.html");
            window.location.href = "login.html";
        }
    });
});