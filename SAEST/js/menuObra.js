import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    redirecionarParaMenu,
    redirecionarParaMenuEmpresa,
    redirecionarParaObras
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const obraForm = document.getElementById('obra-form');
    const editObraForm = document.getElementById('edit-obra-form');
    const empresaSelect = document.getElementById('empresa');
    const editEmpresaSelect = document.getElementById('edit-empresa');

    if (sidebar) {
        const sidebarItems = sidebar.querySelectorAll('li:not(.obras-link)');
        sidebarItems.forEach(item => {
            item.addEventListener('click', () => {
                if (window.innerWidth <= 768) {
                    sidebar.classList.remove('active');
                }
            });
        });
    }

    async function populateEmpresasSelect(selectElement) {
        try {
            const empresasSnapshot = await getDocs(collection(db, "empresas"));
            selectElement.innerHTML = '<option value="" disabled selected>Selecione</option>';
            empresasSnapshot.forEach(doc => {
                const empresaData = doc.data();
                const option = document.createElement('option');
                option.value = doc.id;
                option.textContent = empresaData.razaoSocial || "Empresa sem nome";
                selectElement.appendChild(option);
            });
        } catch (error) {
            console.error("Erro ao carregar empresas para select:", error);
        }
    }

    if (obraForm) {
        obraForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorMessage = document.getElementById('error-message');
            const successMessage = document.getElementById('success-message');
            const modal = document.getElementById('modalObra');
            errorMessage.textContent = '';
            successMessage.textContent = '';

            const obraData = {
                endereco: document.getElementById('endereco').value.trim(),
                status: document.getElementById('status').value,
                empresaId: document.getElementById('empresa').value
            };

            if (!obraData.endereco) {
                errorMessage.textContent = "Por favor, insira o endereço.";
                return;
            }
            if (!obraData.status) {
                errorMessage.textContent = "Por favor, selecione o status.";
                return;
            }
            if (!obraData.empresaId) {
                errorMessage.textContent = "Por favor, selecione uma empresa.";
                return;
            }

            try {
                await addDoc(collection(db, "obras"), obraData);
                successMessage.textContent = 'Obra cadastrada com sucesso!';
                obraForm.reset();
                await renderObrasTable();
                setTimeout(() => {
                    modal.style.display = 'none';
                    successMessage.textContent = '';
                }, 2000);
            } catch (error) {
                errorMessage.textContent = `Erro ao cadastrar obra: ${error.message}`;
            }
        });
    }

    if (editObraForm) {
        editObraForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const errorMessage = document.getElementById('edit-error-message');
            const successMessage = document.getElementById('edit-success-message');
            const modal = document.getElementById('modalEditarObra');
            errorMessage.textContent = '';
            successMessage.textContent = '';

            const obraId = document.getElementById('edit-obra-id').value;
            const obraData = {
                endereco: document.getElementById('edit-endereco').value.trim(),
                status: document.getElementById('edit-status').value,
                empresaId: document.getElementById('edit-empresa').value
            };

            if (!obraData.endereco) {
                errorMessage.textContent = "Por favor, insira o endereço.";
                return;
            }
            if (!obraData.status) {
                errorMessage.textContent = "Por favor, selecione o status.";
                return;
            }
            if (!obraData.empresaId) {
                errorMessage.textContent = "Por favor, selecione uma empresa.";
                return;
            }

            try {
                const obraRef = doc(db, "obras", obraId);
                await updateDoc(obraRef, obraData);
                successMessage.textContent = 'Obra atualizada com sucesso!';
                editObraForm.reset();
                await renderObrasTable();
                setTimeout(() => {
                    modal.style.display = 'none';
                    successMessage.textContent = '';
                }, 2000);
            } catch (error) {
                errorMessage.textContent = `Erro ao atualizar obra: ${error.message}`;
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

    async function renderObrasTable() {
        const lista = document.getElementById('obra-lista');
        if (!lista) {
            console.error("Elemento obra-lista não encontrado!");
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
            const obrasSnapshot = await getDocs(collection(db, "obras"));
            const empresasSnapshot = await getDocs(collection(db, "empresas"));

            if (obrasSnapshot.empty) {
                lista.innerHTML = '<tr><td colspan="3">Nenhuma obra encontrada.</td></tr>';
                return;
            }

            lista.innerHTML = '';
            for (const docSnapshot of obrasSnapshot.docs) {
                const obraData = docSnapshot.data();
                const obraId = docSnapshot.id;

                const empresaDoc = empresasSnapshot.docs.find(emp => emp.id === obraData.empresaId);
                const empresaNome = empresaDoc ? empresaDoc.data().razaoSocial : "Sem empresa associada";

                const escapedEndereco = (obraData.endereco || "Obra sem endereço").replace(/'/g, "\\'");

                const tr = document.createElement('tr');
                tr.setAttribute('data-id', obraId);
                tr.innerHTML = `
                    <td>${obraData.endereco || "Obra sem endereço"}</td>
                    <td>${empresaNome}</td>
                    <td>
                        <button title="Editar" onclick="editObra('${obraId}')"><i class="ri-edit-line"></i></button>
                        <button title="Expandir" class="expand-btn" data-id="${obraId}"><i class="ri-arrow-down-s-line"></i></button>
                        <button title="Deletar" onclick="openDeleteModal('${obraId}', '${escapedEndereco}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                lista.appendChild(tr);

                const expandBtn = tr.querySelector('.expand-btn');
                expandBtn.addEventListener('click', () => toggleExpandRow(obraId, obraData, expandBtn));
            }

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
                        <p><strong>Empresa ID:</strong> ${obraData.empresaId || 'N/A'}</p>
                    </div>
                </td>
            `;
            row.insertAdjacentElement('afterend', expandedRow);
            expandBtn.querySelector('i').className = 'ri-arrow-up-s-line';
        }
    }

    window.editObra = async function(obraId) {
        try {
            const obraRef = doc(db, "obras", obraId);
            const obraDoc = await getDoc(obraRef);
            if (obraDoc.exists()) {
                const obraData = obraDoc.data();
                const modal = document.getElementById('modalEditarObra');
                document.getElementById('edit-obra-id').value = obraId;
                document.getElementById('edit-endereco').value = obraData.endereco || '';
                document.getElementById('edit-status').value = obraData.status || '';
                document.getElementById('edit-empresa').value = obraData.empresaId || '';
                modal.style.display = 'flex';
            } else {
                alert("Erro: Obra não encontrada para edição.");
            }
        } catch (error) {
            console.error("Erro ao buscar dados da obra para edição:", error);
            alert(`Erro ao preparar edição: ${error.message}`);
        }
    };

    window.openDeleteModal = function(obraId, endereco) {
        const modal = document.getElementById('modalDeletarObra');
        const obraNomeSpan = document.getElementById('delete-obra-nome');
        const confirmBtn = document.getElementById('confirm-delete-btn');
        const cancelBtn = document.getElementById('cancel-delete-btn');

        if (modal && obraNomeSpan && confirmBtn && cancelBtn) {
            obraNomeSpan.textContent = endereco;
            modal.style.display = 'flex';

            confirmBtn.onclick = async () => {
                try {
                    await deleteDoc(doc(db, "obras", obraId));
                    await renderObrasTable();
                    modal.style.display = 'none';
                } catch (error) {
                    console.error("Erro ao remover obra:", error);
                    alert(`Erro ao remover obra: ${error.message}`);
                }
            };

            cancelBtn.onclick = () => {
                modal.style.display = 'none';
            };
        }
    };

    window.closeDeleteModal = function() {
        const modal = document.getElementById('modalDeletarObra');
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
            await populateEmpresasSelect(empresaSelect);
            await populateEmpresasSelect(editEmpresaSelect);
            await renderObrasTable();
        } else {
            window.location.href = "login.html";
        }
    });
});