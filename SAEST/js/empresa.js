import { db } from './firebase-config.js';
import {
    collection,
    getDocs,
    query,
    where
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

document.addEventListener('DOMContentLoaded', async () => {
    const lista = document.getElementById('empresa-lista');

    const empresasSnapshot = await getDocs(collection(db, 'empresas'));

    if (empresasSnapshot.empty) {
        lista.innerHTML = '<tr><td colspan="3">Nenhuma construtora registrada.</td></tr>';
        return;
    }

    for (const doc of empresasSnapshot.docs) {
        const empresa = doc.data();
        const empresaId = doc.id;

        // Buscar as obras com empresaId correspondente
        const obrasQuery = query(collection(db, 'obras'), where('empresaId', '==', empresaId));
        const obrasSnapshot = await getDocs(obrasQuery);
        const totalObras = obrasSnapshot.size;

        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${empresa.nomeFantasia}</td>
            <td>${totalObras}</td>
            <td>
                <button title="Editar"><i class="ri-edit-line"></i></button>
            </td>
        `;
        lista.appendChild(tr);
    }
});
