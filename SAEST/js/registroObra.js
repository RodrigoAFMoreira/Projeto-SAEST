import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

console.log("obra.js carregado");

const carregarEmpresas = async () => {
    const selectEmpresa = document.getElementById("empresa");
    try {
        const querySnapshot = await getDocs(collection(db, "empresas"));
        querySnapshot.forEach((doc) => {
            const dados = doc.data();
            const option = document.createElement("option");
            option.value = doc.id;
            option.textContent = dados.razaoSocial;
            selectEmpresa.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar empresas:", erro);
    }
};

const registrarObra = async (endereco, alvara, registro_crea, registro_cal, responsavel_tecnico, empresaId) => {
    try {
        console.log("Tentando registrar obra:", endereco, alvara, registro_crea, registro_cal, responsavel_tecnico, empresaId);

        await addDoc(collection(db, "obras"), {
            endereco,
            alvara,
            registro_crea,
            registro_cal,
            responsavel_tecnico,
            empresaId,
            status: "ativo",
            criadoEm: new Date()
        });

        console.log("Obra registrada com sucesso no Firestore!");
        return true;
    } catch (erro) {
        console.error("Erro ao registrar obra:", erro.code, erro.message);
        throw erro;
    }
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, buscando formulário de obra");
    carregarEmpresas();

    const obraForm = document.getElementById("obra-form");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");

    if (obraForm) {
        console.log("Formulário de obra encontrado, adicionando listener");

        obraForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const endereco = document.getElementById("endereco").value;
            const alvara = document.getElementById("alvara").value;
            const registro_crea = document.getElementById("registro_crea").value;
            const registro_cal = document.getElementById("registro_cal").value;
            const responsavel_tecnico = document.getElementById("responsavel_tecnico").value;
            const empresaId = document.getElementById("empresa").value;

            console.log("Formulário enviado com:", endereco, alvara, registro_crea, registro_cal, responsavel_tecnico, empresaId);

            if (endereco.trim() === "") {
                errorMessage.textContent = "Por favor, insira o endereço.";
                return;
            }
            if (alvara.trim() === "") {
                errorMessage.textContent = "Por favor, insira o alvará.";
                return;
            }
            if (registro_crea.trim() === "") {
                errorMessage.textContent = "Por favor, insira o registro no CREA.";
                return;
            }
            if (registro_cal.trim() === "") {
                errorMessage.textContent = "Por favor, insira o registro no CAL.";
                return;
            }
            if (responsavel_tecnico.trim() === "") {
                errorMessage.textContent = "Por favor, insira o nome do responsável técnico.";
                return;
            }
            if (!empresaId) {
                errorMessage.textContent = "Por favor, selecione uma construtora.";
                return;
            }

            try {
                errorMessage.textContent = "";
                successMessage.textContent = "";
                await registrarObra(endereco, alvara, registro_crea, registro_cal, responsavel_tecnico, empresaId);
                successMessage.textContent = "Obra cadastrada com sucesso!";
                setTimeout(() => {
                    window.location.href = "menu.html";
                }, 2000);
            } catch (erro) {
                errorMessage.textContent = "Erro ao registrar obra: " + erro.message;
            }
        });
    } else {
        console.error("Formulário de obra não encontrado!");
    }
});