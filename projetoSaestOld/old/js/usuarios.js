import { db } from "../firebase-config.js";
import { collection, getDocs } from "firebase/firestore";

const carregarUsuarios = async () => {
    const corpoTabela = document.getElementById("users-table-body");
    corpoTabela.innerHTML = ""; 

    try {
        const consultaSnapshot = await getDocs(collection(db, "users"));
        consultaSnapshot.forEach((doc) => {
            const dadosUsuario = doc.data();
            const linha = `<tr>
                <td>${dadosUsuario.username}</td>
                <td>${dadosUsuario.email}</td>
                <td>${new Date(dadosUsuario.criadoEm.seconds * 1000).toLocaleString()}</td>
            </tr>`;
            corpoTabela.innerHTML += linha;
        });
    } catch (erro) {
        console.error("Erro ao buscar usuários:", erro.message);
    }
};

document.addEventListener("DOMContentLoaded", carregarUsuarios);
