import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    redirecionarParaCadastroObra,
    redirecionarParaMenu,
    redirecionarParaMenuEmpresa,
    redirecionarParaObras
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
    const sidebar = document.getElementById('sidebar');
    const modalEditarObra = document.getElementById('modalEditarObra');

    // Sidebar links
    const dashboardLink = document.querySelector('.dashboard-link');
    if (dashboardLink) dashboardLink.addEventListener('click', () => redirecionarParaMenu());

    const empresasLink = document.querySelector('.empresas-link');
    if (empresasLink) empresasLink.addEventListener('click', () => redirecionarParaMenuEmpresa());

    const obrasLink = document.querySelector('.obras-link');
    if (obrasLink) obrasLink.addEventListener('click', () => redirecionarParaObras());

    const configuracoesLink = document.querySelector('.configuracoes-link');
    if (configuracoesLink) configuracoesLink.addEventListener('click', () => console.log("Configurações ainda não implementado"));

    const btnCadastrarObra = document.getElementById('cadastrar-obra-btn');
    if (btnCadastrarObra) btnCadastrarObra.addEventListener('click', () => redirecionarParaCadastroObra());

    function fecharModalEditarObra() {
        modalEditarObra.style.display = 'none';
    }
    window.fecharModalEditarObra = fecharModalEditarObra;

    async function renderObrasTable() {
        const lista = document.getElementById('obra-lista');
        if (!lista) return;
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
                const obraId = obraDoc.id;
                const empresa = empresasSnapshot.docs.find(emp => emp.id === obraData.empresaId);
                const empresaNome = empresa ? empresa.data().razaoSocial : "Empresa não encontrada";

                const tr = document.createElement('tr');
                tr.setAttribute('data-id', obraId);
                tr.innerHTML = `
                    <td>${obraData.endereco || "Sem endereço"}</td>
                    <td>${empresaNome}</td>
                    <td class="acoes">
                        <button class="icon-button" onclick="editarObra('${obraId}')"><i class="ri-edit-line"></i></button>
                        <button class="icon-button" onclick="deletarObra('${obraId}')"><i class="ri-delete-bin-line"></i></button>
                    </td>
                `;
                lista.appendChild(tr);
            });
        } catch (error) {
            console.error(error);
        }
    }

    window.editarObra = async (obraId) => {
        try {
            const obraRef = doc(db, "obras", obraId);
            const obraDoc = await getDoc(obraRef);
            if (obraDoc.exists()) {
                const obra = obraDoc.data();
                document.getElementById('edit-endereco').value = obra.endereco || '';
                document.getElementById('edit-status').value = obra.status || '';
                document.getElementById('edit-data-inicio').value = obra.dataInicio || '';
                document.getElementById('edit-data-termino').value = obra.dataTermino || '';
                document.getElementById('edit-responsavel').value = obra.responsavelTecnico || '';
                document.getElementById('editar-obra-form').dataset.obraId = obraId;
                modalEditarObra.style.display = 'flex';
            }
        } catch (error) {
            console.error(error);
        }
    };

    document.getElementById('editar-obra-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        const obraId = e.target.dataset.obraId;
        try {
            await updateDoc(doc(db, "obras", obraId), {
                endereco: document.getElementById('edit-endereco').value,
                status: document.getElementById('edit-status').value,
                dataInicio: document.getElementById('edit-data-inicio').value,
                dataTermino: document.getElementById('edit-data-termino').value,
                responsavelTecnico: document.getElementById('edit-responsavel').value
            });
            alert("Obra atualizada com sucesso!");
            modalEditarObra.style.display = 'none';
            renderObrasTable();
        } catch (error) {
            console.error(error);
            alert("Erro ao atualizar obra.");
        }
    });

    onAuthStateChanged(auth, async (user) => {
        if (user) {
            await renderObrasTable();
        } else {
            window.location.href = "login.html";
        }
    });
});