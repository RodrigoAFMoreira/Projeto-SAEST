import { db } from "./firebase-config.js";
import {
    collection,
    getDocs,
    addDoc
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// check
console.log("obra.js carregado");

const carregarEmpresas = async () => {
    const selectEmpresa = document.getElementById("empresa"); // Seleciona o elemento <select> para empresas
    try { // Obtém todos os documentos da coleção "empresas" no Firestore
        const querySnapshot = await getDocs(collection(db, "empresas"));
        if (querySnapshot.empty) {
            console.warn("Nenhuma empresa encontrada no Firestore.");
        }
        // Itera sobre os documentos e cria opções para o <select>
        querySnapshot.forEach((doc) => {
            const dados = doc.data();
            const option = document.createElement("option");
            option.value = doc.id; // Define o ID do documento como valor !!!
            option.textContent = dados.razaoSocial;
            selectEmpresa.appendChild(option);
        });
    } catch (erro) {
        console.error("Erro ao carregar empresas:", erro);
        document.getElementById("error-message").textContent = "Erro ao carregar empresas.";
    }
};

const registrarObra = async (endereco, alvara, registro_crea, registro_cal, responsavel_tecnico, empresaId) => {
    try {
        console.log("Tentando registrar obra:", endereco, alvara, registro_crea, registro_cal, responsavel_tecnico, empresaId);
        await addDoc(collection(db, "obras"), { //adiciona um novo documento à coleção obras no Firestore
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

// Aguarda o carregamento completo do DOM antes de executar o código !!!
document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, buscando formulário de obra");
    carregarEmpresas();

    const obraForm = document.getElementById("obra-form");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");
    const modal = document.getElementById("confirmation-modal");
    const confirmYes = document.getElementById("confirmYes");
    const confirmNo = document.getElementById("confirmNo");
    const btnSalvar = document.getElementById("confirmar-salvar");
    const closeModal = document.querySelector(".close");

     // Verifica se o formulário existe
     if (obraForm) {
        //Checkagem
        console.log("Formulário de obra encontrado, adicionando listeners");

        // Exibe o modal de confirmação quando o botão "Salvar Detalhes" é clicado
        btnSalvar.addEventListener("click", () => {
            modal.style.display = "block"; // Mostra o modal !!!
        });

        // Envia o formulário quando o botão "Sim" do modal é clicado
        confirmYes.addEventListener("click", () => {
            modal.style.display = "none"; // Esconde o modal !!!
            obraForm.dispatchEvent(new Event("submit", { cancelable: true })); // Dispara o evento de submissão
        });
        confirmNo.addEventListener("click", () => {
            modal.style.display = "none"; 
        });

        closeModal.addEventListener("click", () => {
            modal.style.display = "none"; 
        });

        // Fecha o modal quando o usuário clica fora dele
        window.addEventListener("click", (event) => {
            if (event.target === modal) {
                modal.style.display = "none"; // Esconde o modal
            }
        });
        // logica de coleta de dados
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
                successMessage.textContent = "Cadastrando obra...";
                await registrarObra(endereco, alvara, registro_crea, registro_cal, responsavel_tecnico, empresaId);
                successMessage.textContent = "Obra cadastrada com sucesso!";
                setTimeout(() => {
                    window.location.href = "menu.html";
                }, 2000);
            } catch (erro) {
                errorMessage.textContent = "Erro ao registrar obra: " + erro.message;
                successMessage.textContent = "";
            }
        });
    } else {
        console.error("Formulário de obra não encontrado!");
    }
});