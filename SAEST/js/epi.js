import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, updateDoc, query, where } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', () => {
    const today = new Date().toISOString().split('T')[0];
    const dataAquisicao = document.getElementById('data-aquisicao');
    const editDataAquisicao = document.getElementById('edit-data-aquisicao');
    const validade = document.getElementById('validade');
    const editValidade = document.getElementById('edit-validade');
    
    if (dataAquisicao) dataAquisicao.max = today;
    if (editDataAquisicao) editDataAquisicao.max = today;
    if (validade) validade.min = today;
    if (editValidade) editValidade.min = today;

    const tipoOptions = [
        { value: "capacete", label: "Capacete" },
        { value: "luvas", label: "Luvas" },
        { value: "botas", label: "Botas" },
        { value: "mascara", label: "Máscara" },
        { value: "oculos", label: "Óculos de Proteção" }
    ];

    const localUsoOptions = [
        { value: "canteiro", label: "Canteiro de Obras" },
        { value: "armazem", label: "Armazém" },
        { value: "escritorio", label: "Escritório" },
        { value: "manutencao", label: "Manutenção" }
    ];

    async function populateObraSelect() {
        const obraSelect = document.getElementById('obra');
        const editObraSelect = document.getElementById('edit-obra');
        try {
            const obrasSnapshot = await getDocs(collection(db, "obras"));
            if (obraSelect) {
                obraSelect.innerHTML = '<option value="" disabled selected>Selecione</option>';
                obrasSnapshot.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.data().nome || doc.data().endereco || 'Obra sem nome';
                    obraSelect.appendChild(option);
                });
            }
            if (editObraSelect) {
                editObraSelect.innerHTML = '<option value="" disabled selected>Selecione</option>';
                obrasSnapshot.forEach(doc => {
                    const option = document.createElement('option');
                    option.value = doc.id;
                    option.textContent = doc.data().nome || doc.data().endereco || 'Obra sem nome';
                    editObraSelect.appendChild(option);
                });
            }
        } catch (error) {
            console.error("Erro ao carregar obras:", error);
        }
    }

    function populateTipoAndLocalUso() {
        const tipoSelect = document.getElementById('tipo');
        const editTipoSelect = document.getElementById('edit-tipo');
        const localUsoSelect = document.getElementById('local-uso');
        const editLocalUsoSelect = document.getElementById('edit-local-uso');

        if (tipoSelect) {
            tipoSelect.innerHTML = '<option value="" disabled selected>Selecione o tipo</option>';
            tipoOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                tipoSelect.appendChild(opt);
            });
        }

        if (editTipoSelect) {
            editTipoSelect.innerHTML = '<option value="" disabled selected>Selecione o tipo</option>';
            tipoOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                editTipoSelect.appendChild(opt);
            });
        }

        if (localUsoSelect) {
            localUsoSelect.innerHTML = '<option value="" disabled selected>Selecione o local</option>';
            localUsoOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                localUsoSelect.appendChild(opt);
            });
        }

        if (editLocalUsoSelect) {
            editLocalUsoSelect.innerHTML = '<option value="" disabled selected>Selecione o local</option>';
            localUsoOptions.forEach(option => {
                const opt = document.createElement('option');
                opt.value = option.value;
                opt.textContent = option.label;
                editLocalUsoSelect.appendChild(opt);
            });
        }
    }

    async function renderEpiTable(filtroCodigo = "", filtroTipo = "", filtroCondicao = "", filtroLocalUso = "", filtroDisponibilidade = "", filtroValidade = "") {
        const lista = document.getElementById('epi-lista');
        if (!lista) {
            console.error("Elemento epi-lista não encontrado!");
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
            let queryRef = collection(db, "epis");
            if (filtroCondicao) queryRef = query(queryRef, where("condicao", "==", filtroCondicao));
            if (filtroDisponibilidade) queryRef = query(queryRef, where("disponibilidade", "==", filtroDisponibilidade));
            if (filtroValidade === "válido") {
                queryRef = query(queryRef, where("validade", ">=", today));
            } else if (filtroValidade === "expirado") {
                queryRef = query(queryRef, where("validade", "<", today));
            } else if (filtroValidade === "sem-validade") {
                queryRef = query(queryRef, where("validade", "==", null));
            }

            const episSnapshot = await getDocs(queryRef);
            const obrasSnapshot = await getDocs(collection(db, "obras"));

            let filteredDocs = episSnapshot.docs;
            if (filtroCodigo || filtroTipo || filtroLocalUso) {
                const codigoLower = filtroCodigo.toLowerCase();
                const tipoLower = filtroTipo.toLowerCase();
                const localUsoLower = filtroLocalUso.toLowerCase();
                filteredDocs = episSnapshot.docs.filter((doc) => {
                    const epiData = doc.data();
                    const codigoEpi = (epiData.codigoEpi || "").toLowerCase();
                    const tipo = (epiData.tipo || "").toLowerCase();
                    const localUso = (epiData.localUso || "").toLowerCase();
                    return (
                        (!filtroCodigo || codigoEpi.includes(codigoLower)) &&
                        (!filtroTipo || tipo.includes(tipoLower)) &&
                        (!filtroLocalUso || localUso.includes(localUsoLower))
                    );
                });
            }

            if (filteredDocs.length === 0) {
                lista.innerHTML = '<tr><td colspan="3">Nenhum EPI encontrado.</td></tr>';
                return;
            }

            lista.innerHTML = "";
            filteredDocs.forEach((doc) => {
                const epiData = doc.data();
                const obra = obrasSnapshot.docs.find(obraDoc => obraDoc.id === epiData.obraId);
                const escapedTipo = (epiData.tipo || 'EPI').replace(/'/g, "\\'");
                const tr = document.createElement('tr');
                tr.setAttribute('data-id', doc.id);
                tr.innerHTML = `
                    <td>${epiData.tipo || 'N/A'}</td>
                    <td>${obra ? (obra.data().nome || obra.data().endereco || 'Obra sem nome') : 'Não especificada'}</td>
                    <td>
                        <button title="Editar" class="btn primary" onclick="editarEpi('${doc.id}')"><i class="ri-edit-line"></i> Editar</button>
                        <button title="Expandir" class="expand-btn" data-id="${doc.id}"><i class="ri-arrow-down-s-line"></i></button>
                        <button title="Excluir" class="btn secondary" onclick="excluirEpi('${doc.id}', '${escapedTipo}')"><i class="ri-delete-bin-line"></i> Excluir</button>
                    </td>
                `;
                lista.appendChild(tr);
                const expandBtn = tr.querySelector('.expand-btn');
                expandBtn.addEventListener('click', () => toggleExpandEpiRow(doc.id, epiData, expandBtn));
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
                .expand-btn {
                    background: none;
                    border: none;
                    cursor: pointer;
                    padding: 5px;
                    font-size: 1.2em;
                }
                .expand-btn i {
                    vertical-align: middle;
                }
            `;
            document.head.appendChild(style);
        } catch (error) {
            console.error("Erro ao carregar EPIs:", error);
            lista.innerHTML = `<tr><td colspan="3">Erro ao carregar EPIs: ${error.message}</td></tr>`;
        }
    }

    function toggleExpandEpiRow(epiId, epiData, expandBtn) {
        const row = document.querySelector(`tr[data-id="${epiId}"]`);
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
            expandedRow.dataset.id = epiId;
            expandedRow.innerHTML = `
                <td colspan="3">
                    <div class="expanded-details">
                        <p><strong>Condição:</strong> ${epiData.condicao || 'N/A'}</p>
                        <p><strong>Local de Uso:</strong> ${epiData.localUso || 'N/A'}</p>
                        <p><strong>Disponibilidade:</strong> ${epiData.disponibilidade || 'N/A'}</p>
                        <p><strong>Data de Aquisição:</strong> ${epiData.dataAquisicao || 'N/A'}</p>
                        <p><strong>Validade:</strong> ${epiData.validade || 'N/A'}</p>
                        <p><strong>Código de EPI:</strong> ${epiData.codigoEpi || 'N/A'}</p>
                        <p><strong>Descrição:</strong> ${epiData.descricao || 'N/A'}</p>
                        <p><strong>Quantidade:</strong> ${epiData.quantidade || 'N/A'}</p>
                    </div>
                </td>
            `;
            row.insertAdjacentElement('afterend', expandedRow);
            expandBtn.querySelector('i').className = 'ri-arrow-up-s-line';
        }
    }

    function abrirModalEpi() {
        const modal = document.getElementById('modalEpi');
        if (modal) {
            populateTipoAndLocalUso();
            modal.style.display = 'flex';
        }
    }

    function fecharModalEpi() {
        const modal = document.getElementById('modalEpi');
        const form = document.getElementById('epi-form');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        if (modal) {
            modal.style.display = 'none';
        }
        if (form) {
            form.reset();
        }
        if (errorMessage) {
            errorMessage.textContent = '';
        }
        if (successMessage) {
            successMessage.textContent = '';
        }
    }

    function fecharModalEditarEpi() {
        const modal = document.getElementById('modalEditarEpi');
        const form = document.getElementById('edit-epi-form');
        const errorMessage = document.getElementById('edit-error-message');
        const successMessage = document.getElementById('edit-success-message');
        if (modal) {
            modal.style.display = 'none';
        }
        if (form) {
            form.reset();
        }
        if (errorMessage) {
            errorMessage.textContent = '';
        }
        if (successMessage) {
            successMessage.textContent = '';
        }
    }

    document.getElementById('epi-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        const modal = document.getElementById('modalEpi');
        errorMessage.textContent = '';
        successMessage.textContent = '';

        const epiData = {
            tipo: document.getElementById('tipo').value.trim(),
            condicao: document.getElementById('condicao').value,
            localUso: document.getElementById('local-uso').value,
            disponibilidade: document.getElementById('disponibilidade').value,
            dataAquisicao: document.getElementById('data-aquisicao').value,
            validade: document.getElementById('validade').value,
            codigoEpi: document.getElementById('codigo-epi').value.trim(),
            descricao: document.getElementById('descricao').value.trim(),
            quantidade: parseInt(document.getElementById('quantidade').value),
            obraId: document.getElementById('obra').value
        };

        if (!epiData.tipo) {
            errorMessage.textContent = "Por favor, selecione o tipo de EPI.";
            return;
        }
        if (!epiData.condicao) {
            errorMessage.textContent = "Por favor, selecione a condição.";
            return;
        }
        if (!epiData.localUso) {
            errorMessage.textContent = "Por favor, selecione o local de uso.";
            return;
        }
        if (!epiData.disponibilidade) {
            errorMessage.textContent = "Por favor, selecione a disponibilidade.";
            return;
        }
        if (!epiData.dataAquisicao) {
            errorMessage.textContent = "Por favor, insira a data de aquisição.";
            return;
        }
        if (!epiData.codigoEpi) {
            errorMessage.textContent = "Por favor, insira o código de EPI.";
            return;
        }
        if (!epiData.quantidade || epiData.quantidade < 1) {
            errorMessage.textContent = "Por favor, insira uma quantidade válida.";
            return;
        }
        if (!epiData.obraId) {
            errorMessage.textContent = "Por favor, selecione a obra associada.";
            return;
        }

        try {
            await addDoc(collection(db, "epis"), epiData);
            successMessage.textContent = 'EPI cadastrado com sucesso!';
            document.getElementById('epi-form').reset();
            await renderEpiTable();
            setTimeout(() => {
                modal.style.display = 'none';
                successMessage.textContent = '';
            }, 1000);
        } catch (error) {
            errorMessage.textContent = `Erro ao cadastrar EPI: ${error.message}`;
        }
    });

    document.getElementById('edit-epi-form')?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const errorMessage = document.getElementById('edit-error-message');
        const successMessage = document.getElementById('edit-success-message');
        const modal = document.getElementById('modalEditarEpi');
        errorMessage.textContent = '';
        successMessage.textContent = '';

        const epiId = document.getElementById('edit-epi-id').value;
        const epiData = {
            tipo: document.getElementById('edit-tipo').value.trim(),
            condicao: document.getElementById('edit-condicao').value,
            localUso: document.getElementById('edit-local-uso').value,
            disponibilidade: document.getElementById('edit-disponibilidade').value,
            dataAquisicao: document.getElementById('edit-data-aquisicao').value,
            validade: document.getElementById('edit-validade').value,
            codigoEpi: document.getElementById('edit-codigo-epi').value.trim(),
            descricao: document.getElementById('edit-descricao').value.trim(),
            quantidade: parseInt(document.getElementById('edit-quantidade').value),
            obraId: document.getElementById('edit-obra').value
        };

        if (!epiData.tipo) {
            errorMessage.textContent = "Por favor, selecione o tipo de EPI.";
            return;
        }
        if (!epiData.condicao) {
            errorMessage.textContent = "Por favor, selecione a condição.";
            return;
        }
        if (!epiData.localUso) {
            errorMessage.textContent = "Por favor, selecione o local de uso.";
            return;
        }
        if (!epiData.disponibilidade) {
            errorMessage.textContent = "Por favor, selecione a disponibilidade.";
            return;
        }
        if (!epiData.dataAquisicao) {
            errorMessage.textContent = "Por favor, insira a data de aquisição.";
            return;
        }
        if (!epiData.codigoEpi) {
            errorMessage.textContent = "Por favor, insira o código de EPI.";
            return;
        }
        if (!epiData.quantidade || epiData.quantidade < 1) {
            errorMessage.textContent = "Por favor, insira uma quantidade válida.";
            return;
        }
        if (!epiData.obraId) {
            errorMessage.textContent = "Por favor, selecione a obra associada.";
            return;
        }

        try {
            await updateDoc(doc(db, "epis", epiId), epiData);
            successMessage.textContent = 'EPI atualizado com sucesso!';
            document.getElementById('edit-epi-form').reset();
            await renderEpiTable();
            setTimeout(() => {
                modal.style.display = 'none';
                successMessage.textContent = '';
            }, 1000);
        } catch (error) {
            errorMessage.textContent = `Erro ao atualizar EPI: ${error.message}`;
        }
    });

    window.editarEpi = async function(epiId) {
        try {
            const epiRef = doc(db, "epis", epiId);
            const epiDoc = await getDoc(epiRef);
            if (epiDoc.exists()) {
                const epiData = epiDoc.data();
                const modal = document.getElementById('modalEditarEpi');
                populateTipoAndLocalUso(); 
                document.getElementById('edit-epi-id').value = epiId;
                document.getElementById('edit-tipo').value = epiData.tipo || '';
                document.getElementById('edit-condicao').value = epiData.condicao || '';
                document.getElementById('edit-local-uso').value = epiData.localUso || '';
                document.getElementById('edit-disponibilidade').value = epiData.disponibilidade || '';
                document.getElementById('edit-data-aquisicao').value = epiData.dataAquisicao || '';
                document.getElementById('edit-validade').value = epiData.validade || '';
                document.getElementById('edit-codigo-epi').value = epiData.codigoEpi || '';
                document.getElementById('edit-descricao').value = epiData.descricao || '';
                document.getElementById('edit-quantidade').value = epiData.quantidade || 1;
                document.getElementById('edit-obra').value = epiData.obraId || '';
                modal.style.display = 'flex';
            } else {
                alert("Erro: EPI não encontrado para edição.");
            }
        } catch (error) {
            console.error("Erro ao buscar dados do EPI para edição:", error);
            alert(`Erro ao preparar edição: ${error.message}`);
        }
    };

    window.excluirEpi = function(epiId, tipo) {
        abrirModalConfirmarExclusao(
            `Tem certeza que deseja excluir o EPI "${tipo}"?`,
            async () => {
                try {
                    await deleteDoc(doc(db, "epis", epiId));
                    await renderEpiTable();
                    fecharModalConfirmarExclusao();
                } catch (error) {
                    console.error("Erro ao remover EPI:", error);
                    alert(`Erro ao remover EPI: ${error.message}`);
                }
            }
        );
    };

    const searchInput = document.getElementById('filtro-codigo');
    const tipoFilter = document.getElementById('filtro-tipo');
    const condicaoFilter = document.getElementById('filtro-condicao');
    const localUsoFilter = document.getElementById('filtro-local-uso');
    const disponibilidadeFilter = document.getElementById('filtro-disponibilidade');
    const validadeFilter = document.getElementById('filtro-validade');

    if (searchInput && tipoFilter && condicaoFilter && localUsoFilter && disponibilidadeFilter && validadeFilter) {
        const applyFilter = () => {
            const filtroCodigo = searchInput.value.trim();
            const filtroTipo = tipoFilter.value.trim();
            const filtroCondicao = condicaoFilter.value;
            const filtroLocalUso = localUsoFilter.value.trim();
            const filtroDisponibilidade = disponibilidadeFilter.value;
            const filtroValidade = validadeFilter.value;
            renderEpiTable(filtroCodigo, filtroTipo, filtroCondicao, filtroLocalUso, filtroDisponibilidade, filtroValidade);
        };

        searchInput.addEventListener('input', applyFilter);
        tipoFilter.addEventListener('input', applyFilter); 
        condicaoFilter.addEventListener('change', applyFilter);
        localUsoFilter.addEventListener('input', applyFilter); 
        disponibilidadeFilter.addEventListener('change', applyFilter);
        validadeFilter.addEventListener('change', applyFilter);
    }

    window.renderGerenciarEpiLists = function () {
        const listaTiposEpi = document.getElementById('lista-tipos-epi');
        const listaLocaisUso = document.getElementById('lista-locais-uso');

        if (!listaTiposEpi || !listaLocaisUso) {
            console.error("Elementos lista-tipos-epi ou lista-locais-uso não encontrados!");
            return;
        }

        listaTiposEpi.innerHTML = '';
        listaLocaisUso.innerHTML = '';

        tipoOptions.forEach((option, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${option.label}
                ${index >= 5 ? `<button class="btn secondary" onclick="removerTipoEpi(${index})">
                    <i class="ri-delete-bin-line"></i> Excluir
                </button>` : ''}
            `;
            listaTiposEpi.appendChild(li);
        });

        localUsoOptions.forEach((option, index) => {
            const li = document.createElement('li');
            li.innerHTML = `
                ${option.label}
                ${index >= 4 ? `<button class="btn secondary" onclick="removerLocalUso(${index})">
                    <i class="ri-delete-bin-line"></i> Excluir
                </button>` : ''}
            `;
            listaLocaisUso.appendChild(li);
        });
    };

    window.adicionarTipoEpi = function () {
        const novoTipoInput = document.getElementById('novo-tipo-epi');
        const errorMessage = document.getElementById('gerenciar-error-message');
        const successMessage = document.getElementById('gerenciar-success-message');

        if (!novoTipoInput || !errorMessage || !successMessage) {
            console.error("Elementos do modal Gerenciar EPI não encontrados!");
            return;
        }

        const novoTipo = novoTipoInput.value.trim();
        if (!novoTipo) {
            errorMessage.textContent = 'Por favor, insira um tipo de EPI válido.';
            return;
        }

        if (tipoOptions.some(option => option.label.toLowerCase() === novoTipo.toLowerCase())) {
            errorMessage.textContent = 'Este tipo de EPI já existe.';
            return;
        }

        tipoOptions.push({
            value: novoTipo.toLowerCase().replace(/\s+/g, '-'),
            label: novoTipo
        });

        novoTipoInput.value = '';
        errorMessage.textContent = '';
        successMessage.textContent = 'Tipo de EPI adicionado com sucesso!';

        populateTipoAndLocalUso();
        renderGerenciarEpiLists();
        setTimeout(() => {
            successMessage.textContent = '';
        }, 2000);
    };

    window.adicionarLocalUso = function () {
        const novoLocalInput = document.getElementById('novo-local-uso');
        const errorMessage = document.getElementById('gerenciar-error-message');
        const successMessage = document.getElementById('gerenciar-success-message');

        if (!novoLocalInput || !errorMessage || !successMessage) {
            console.error("Elementos do modal Gerenciar EPI não encontrados!");
            return;
        }

        const novoLocal = novoLocalInput.value.trim();
        if (!novoLocal) {
            errorMessage.textContent = 'Por favor, insira um local de uso válido.';
            return;
        }

        if (localUsoOptions.some(option => option.label.toLowerCase() === novoLocal.toLowerCase())) {
            errorMessage.textContent = 'Este local de uso já existe.';
            return;
        }

        localUsoOptions.push({
            value: novoLocal.toLowerCase().replace(/\s+/g, '-'),
            label: novoLocal
        });

        novoLocalInput.value = '';
        errorMessage.textContent = '';
        successMessage.textContent = 'Local de uso adicionado com sucesso!';

        populateTipoAndLocalUso();
        renderGerenciarEpiLists();
        setTimeout(() => {
            successMessage.textContent = '';
        }, 2000);
    };

    window.removerTipoEpi = function (index) {
        abrirModalConfirmarExclusao(
            `Tem certeza que deseja excluir o tipo "${tipoOptions[index].label}"?`,
            () => {
                tipoOptions.splice(index, 1);
                populateTipoAndLocalUso();
                renderGerenciarEpiLists();
                fecharModalConfirmarExclusao();
            }
        );
    };

    window.removerLocalUso = function (index) {
        abrirModalConfirmarExclusao(
            `Tem certeza que deseja excluir o local "${localUsoOptions[index].label}"?`,
            () => {
                localUsoOptions.splice(index, 1);
                populateTipoAndLocalUso();
                renderGerenciarEpiLists();
                fecharModalConfirmarExclusao();
            }
        );
    };

    document.querySelector('.btn.primary[onclick="abrirModalEpi()"]')?.addEventListener('click', abrirModalEpi);
    document.querySelector('#modalEpi .btn.secondary')?.addEventListener('click', fecharModalEpi);
    document.querySelector('#modalEpi .modal-close')?.addEventListener('click', fecharModalEpi);
    document.querySelector('#modalEditarEpi .btn.secondary')?.addEventListener('click', fecharModalEditarEpi);
    document.querySelector('#modalEditarEpi .modal-close')?.addEventListener('click', fecharModalEditarEpi);

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            const userNameElement = document.querySelector(".user-profile .name");
            const userEmailElement = document.querySelector(".user-profile .email");
            if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
            if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
            await populateObraSelect();
            populateTipoAndLocalUso(); 
            await renderEpiTable();
        } else {
            window.location.href = "login.html";
        }
    });
});