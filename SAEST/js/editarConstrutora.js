import { auth, db } from "../js/firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { redirecionarParaMenu, redirecionarParaLogin } from "../js/redirecionar.js";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        redirecionarParaLogin();
    } else {
        loadData();
    }
});

function loadData() {
    const editData = JSON.parse(localStorage.getItem('editData'));
    if (editData && editData.collectionName === "empresas") {
        document.getElementById('razaoSocial').value = editData.data.razaoSocial || '';
        document.getElementById('nomeFantasia').value = editData.data.nomeFantasia || '';
        document.getElementById('email').value = editData.data.email || '';
        document.getElementById('porte').value = editData.data.porte || '';
        document.getElementById('telefone').value = editData.data.telefone || '';
        document.getElementById('responsavelTecnico').value = editData.data.responsavelTecnico || '';
    }
}

document.getElementById('edit-empresa-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const editData = JSON.parse(localStorage.getItem('editData'));
    
    if (editData && editData.collectionName === "empresas") {
        try {
            const empresaRef = doc(db, "empresas", editData.docId);
            await updateDoc(empresaRef, {
                razaoSocial: document.getElementById('razaoSocial').value,
                nomeFantasia: document.getElementById('nomeFantasia').value,
                email: document.getElementById('email').value,
                porte: document.getElementById('porte').value,
                telefone: document.getElementById('telefone').value,
                responsavelTecnico: document.getElementById('responsavelTecnico').value
            });
            alert('Empresa atualizada com sucesso!');
            localStorage.removeItem('editData');
            redirecionarParaMenu();
        } catch (error) {
            console.error('Erro ao atualizar empresa:', error);
            alert('Erro ao atualizar empresa: ' + error.message);
        }
    }
});

document.getElementById('cancel-btn').addEventListener('click', () => {
    localStorage.removeItem('editData');
    redirecionarParaMenu();
});