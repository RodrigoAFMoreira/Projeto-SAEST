import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

console.log("obra.js carregado");

const registrarObra = async (endereco, alvara, registro_crea, registro_cal, responsavel_tecnico) => {
    try {
        console.log("Tentando registrar obra:", endereco, alvara, registro_crea, registro_cal, responsavel_tecnico);
        
        await addDoc(collection(db, "obras"), {
            endereco,
            alvara,
            registro_crea,
            registro_cal,
            responsavel_tecnico,
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

            console.log("Formulário enviado com:", endereco, alvara, registro_crea, registro_cal, responsavel_tecnico);

            if (endereco.trim() === "") {
                errorMessage.textContent = "Por favor, insira o endereço.";
                console.log("Validação falhou: endereço vazio");
                return;
            }
            if (alvara.trim() === "") {
                errorMessage.textContent = "Por favor, insira o alvará.";
                console.log("Validação falhou: alvará vazio");
                return;
            }
            if (registro_crea.trim() === "") {
                errorMessage.textContent = "Por favor, insira o registro no CREA.";
                console.log("Validação falhou: registro CREA vazio");
                return;
            }
            if (registro_cal.trim() === "") {
                errorMessage.textContent = "Por favor, insira o registro no CAL.";
                console.log("Validação falhou: registro CAL vazio");
                return;
            }
            if (responsavel_tecnico.trim() === "") {
                errorMessage.textContent = "Por favor, insira o nome do responsável técnico.";
                console.log("Validação falhou: responsável técnico vazio");
                return;
            }

            try {
                errorMessage.textContent = "";
                successMessage.textContent = "";
                await registrarObra(endereco, alvara, registro_crea, registro_cal, responsavel_tecnico);
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