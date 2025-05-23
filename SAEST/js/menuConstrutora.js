// menuObra gerencia uma interface para cadastro, edição e exclusão de construtoras. Ele renderiza uma tabela com dados de construtoras e; 
// suas obras relacionadas(!!!), permite expandir detalhes, alternar entre formulários de criação e edição via modais, e suporta 
// navegação responsiva. Logs rastreiam erros e interações.

import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    redirecionarParaMenu,
    redirecionarParaMenuEmpresa,
    redirecionarParaObras,
    redirecionarParaCadastroObra
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const construtoraForm = document.getElementById('construtora-form');
    const editConstrutoraForm = document.getElementById('edit-construtora-form');

    if (sidebar) {
        const sidebarItems = sidebar.querySelectorAll('li:not(.dashboard-link)');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    if (construtoraForm) {
        construtoraForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            const modal = document.getElementById('modalConstrutora');
            errorMessage.textContent = '';
            successMessage.textContent = '';

            const empresaData = {
                razaoSocial: document.getElementById('razao-social').value.trim(),
                nomeFantasia: document.getElementById('nome-fantasia').value.trim(),
                email: document.getElementById('email').value.trim(),
                porte: document.getElementById('porte').value,
                telefone: document.getElementById('telefone').value.trim(),
                responsavelTecnico: document.getElementById('responsavel-tecnico').value.trim()
            };

            if (!empresaData.razaoSocial) {
                errorMessage.textContent = "Por favor, insira a razão social.";
                return;
            }
            if (!empresaData.nomeFantasia) {
                errorMessage.textContent = "Por favor, insira o nome fantasia.";
                return;
            }
            if (!empresaData.email) {
                errorMessage.textContent = "Por favor, insira o e-mail.";
                return;
            }
            if (!empresaData.porte) {
                errorMessage.textContent = "Por favor, selecione o porte da empresa.";
                return;
            }
            if (!empresaData.telefone) {
                errorMessage.textContent = "Por favor, insira o telefone.";
                return;
            }
            if (!empresaData.responsavelTecnico) {
                errorMessage.textContent = "Por favor, insira o responsável técnico.";
                return;
            }

            try {
                await addDoc(collection(db, "empresas"), empresaData);
                successMessage.textContent = 'Empresa cadastrada com sucesso!';
                construtoraForm.reset();
                await renderEmpresasTable();
                setTimeout(() => {
                    modal.style.display = 'none';
                    successMessage.textContent = '';
                }, 2000);
            } catch (error) {
                errorMessage.textContent = `Erro ao cadastrar empresa: ${error.message}`;
            }
        });
    }

    if (editConstrutoraForm) {
        editConstrutoraForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorMessage = document.getElementById('edit-error-message');
            const successMessage = document.getElementById('edit-success-message');
            const modal = document.getElementById('modalEditarConstrutora');
            errorMessage.textContent = '';
            successMessage.textContent = '';

            const empresaId = document.getElementById('edit-empresa-id').value;
            const empresaData = {
                razaoSocial: document.getElementById('edit-razao-social').value.trim(),
                nomeFantasia: document.getElementById('edit-nome-fantasia').value.trim(),
                email: document.getElementById('edit-email').value.trim(),
                porte: document.getElementById('edit-porte').value,
                telefone: document.getElementById('edit-telefone').value.trim(),
                responsavelTecnico: document.getElementById('edit-responsavel-tecnico').value.trim()
            };

            if (!empresaData.razaoSocial) {
                errorMessage.textContent = "Por favor, insira a razão social.";
                return;
            }
            if (!empresaData.nomeFantasia) {
                errorMessage.textContent = "Por favor, insira o nome fantasia.";
                return;
            }
            if (!empresaData.email) {
                errorMessage.textContent = "Por favor, insira o e-mail.";
                return;
            }
            if (!empresaData.porte) {
                errorMessage.textContent = "Por favor, selecione o porte da empresa.";
                return;
            }
            if (!empresaData.telefone) {
                errorMessage.textContent = "Por favor, insira o telefone.";
                return;
            }
            if (!empresaData.responsavelTecnico) {
                errorMessage.textContent = "Por favor, insira o responsável técnico.";
                return;
            }

            try {
                const empresaRef = doc(db, "empresas", empresaId);
                await updateDoc(empresaRef, empresaData);
                successMessage.textContent = 'Empresa atualizada com sucesso!';
                editConstrutoraForm.reset();
                await renderEmpresasTable();
                setTimeout(() => {
                    modal.style.display = 'none';
                    successMessage.textContent = '';
                }, 2000);
            } catch (error) {
                errorMessage.textContent = `Erro ao atualizar empresa: ${error.message}`;
            }
        });
    }

    const dashboardLink = document.querySelector('.dashboard-link');
    if (dashboardLink) {
        dashboardLink.addEventListener('click', () => redirecionarParaMenu());
    }

    const empresasLink = document.querySelector('.empresas-link');
    if (empresasLink) {
        empresasLink.addEventListener('click', () => redirecionarParaMenuEmpresa());
    }

    const obrasLink = document.querySelector('.obras-link');
    if (obrasLink) {
        obrasLink.addEventListener('click', () => redirecionarParaObras());
    }

    const btnNovaObra = document.querySelector('.btn.secondary');
    if (btnNovaObra) {
        btnNovaObra.addEventListener('click', redirecionarParaCadastroObra);
    }

    const btnGoToObras = document.getElementById('Para Obras');
    if (btnGoToObras) {
        btnGoToObras.addEventListener('click', () => redirecionarParaObras());
    }

    async function renderEmpresasTable(filter = "", status = "") {
        const lista = document.getElementById('empresa-lista');
        if (!lista) {
            console.error("Elemento empresa-lista não encontrado!");
            return;
        }
        lista.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="loading-spinner"></div>
                </td>
            </tr>
        `;

        try {
            let queryRef = collection(db, "empresas");
            if (status && status !== "all") {
                queryRef = query(queryRef, where("status", "==", status));
            }

            const empresasSnapshot = await getDocs(queryRef);
            const obrasSnapshot = await getDocs(collection(db, "obras"));

            let filteredDocs = empresasSnapshot.docs;
            if (filter) {
                const filterLower = filter.toLowerCase();
                filteredDocs = empresasSnapshot.docs.filter((doc) => {
                    const razaoSocial = doc.data().razaoSocial || "";
                    return razaoSocial.toLowerCase().includes(filterLower);
                });
            }

            if (filteredDocs.length === 0) {
                lista.innerHTML = '<tr><td colspan="3">Nenhuma empresa encontrada.</td></tr>';
                return;
            }

            lista.innerHTML = '';
            filteredDocs.forEach((docSnapshot) => {
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
                            }).join("<br>")
                            : "Nenhuma obra relacionada"
                    }</td>
                    <td>
                        <button title="Editar" onclick="editEmpresa('${empresaId}')"><i class="ri-edit-line"></i></button>
                        <button title="Expandir" class="expand-btn" data-id="${empresaId}"><i class="ri-arrow-down-s-line"></i></button>
                        <button title="Deletar" onclick="openDeleteModal('${empresaId}', '${escapedRazaoSocial}')"><i class="ri-delete-bin-line"></i></button>
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

    window.editEmpresa = async function(empresaId) {
        try {
            const empresaRef = doc(db, "empresas", empresaId);
            const empresaDoc = await getDoc(empresaRef);
            if (empresaDoc.exists()) {
                const empresaData = empresaDoc.data();
                const modal = document.getElementById('modalEditarConstrutora');
                document.getElementById('edit-empresa-id').value = empresaId;
                document.getElementById('edit-razao-social').value = empresaData.razaoSocial || '';
                document.getElementById('edit-nome-fantasia').value = empresaData.nomeFantasia || '';
                document.getElementById('edit-email').value = empresaData.email || '';
                document.getElementById('edit-porte').value = empresaData.porte || '';
                document.getElementById('edit-telefone').value = empresaData.telefone || '';
                document.getElementById('edit-responsavel-tecnico').value = empresaData.responsavelTecnico || '';
                modal.style.display = 'flex';
            } else {
                alert("Erro: Empresa não encontrada para edição.");
            }
        } catch (error) {
            console.error("Erro ao buscar dados da empresa para edição:", error);
            alert(`Erro ao preparar edição: ${error.message}`);
        }
    };

    window.openDeleteModal = function(empresaId, razaoSocial) {
        const modal = document.getElementById('modalDeletarConstrutora');
        const empresaNomeSpan = document.getElementById('delete-empresa-nome');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const cancelBtn = document.getElementById('cancel-delete-btn');

        if (modal && empresaNomeSpan && confirmBtn && cancelBtn) {
            empresaNomeSpan.textContent = razaoSocial;
            modal.style.display = 'flex';

            confirmBtn.onclick = async () => {
                try {
                    await deleteDoc(doc(db, "empresas", empresaId));
                    await renderEmpresasTable();
                    modal.style.display = 'none';
                } catch (error) {
                    console.error("Erro ao remover empresa:", error);
                    alert(`Erro ao remover empresa: ${error.message}`);
                }
            };

            cancelBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
    };

    window.closeDeleteModal = function() {
        const modal = document.getElementById('modalDeletarConstrutora');
        if (modal) {
            modal.style.display = 'none';
        }
    };

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userNameElement = document.querySelector(".user-profile .name");
            const userEmailElement = document.querySelector(".user-profile .email");
            if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
            if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";

            const searchInput = document.querySelector('.content-header input[placeholder="Pesquisar por nome"]');
            const statusSelect = document.querySelector('.content-header select');

            function updateTable() {
                const filter = searchInput ? searchInput.value.trim() : "";
                const status = statusSelect ? statusSelect.value : "";
                renderEmpresasTable(filter, status);
            }

            if (searchInput) {
                searchInput.addEventListener('input', updateTable);
            }
            if (statusSelect) {
                statusSelect.addEventListener('change', updateTable);
            }

            await renderEmpresasTable();
        } else {
            window.location.href = "login.html";
        }
    });
});