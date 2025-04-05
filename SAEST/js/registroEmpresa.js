import { db } from "./firebase-config.js";
import { collection, addDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

console.log("empresa.js carregado");

const registrarEmpresa = async (nome, cnpj, email, telefone) => {
    try {
        console.log("Tentando registrar empresa:", nome, cnpj, email, telefone);
        
        await addDoc(collection(db, "empresas"), {
            nome,
            cnpj,
            email,
            telefone,
            criadoEm: new Date()
        });
        
        console.log("Empresa registrada com sucesso no Firestore!");
        return true; 
    } catch (erro) {
        console.error("Erro ao registrar empresa:", erro.code, erro.message);
        throw erro; 
    }
};

document.addEventListener("DOMContentLoaded", () => {
    console.log("DOM carregado, buscando formulário de empresa");
    const companyForm = document.getElementById("empresa-form");
    const errorMessage = document.getElementById("error-message");
    const successMessage = document.getElementById("success-message");

    if (companyForm) {
        console.log("Formulário de empresa encontrado, adicionando listener");
        companyForm.addEventListener("submit", async (e) => {
            e.preventDefault();

            const nome = document.getElementById("nome").value;
            const cnpj = document.getElementById("cnpj").value;
            const email = document.getElementById("email").value;
            const telefone = document.getElementById("telefone").value;

            console.log("Formulário enviado com:", nome, cnpj, email, telefone);

            if (nome.trim() === "") {
                errorMessage.textContent = "Por favor, insira o nome da empresa.";
                console.log("Validação falhou: nome vazio");
                return;
            }
            if (!cnpj.match(/^\d{2}\.\d{3}\.\d{3}\/\d{4}-\d{2}$/)) {
                errorMessage.textContent = "Por favor, insira um CNPJ válido (formato: 12.345.678/0001-99).";
                console.log("Validação falhou: CNPJ inválido");
                return;
            }
            if (!email.includes("@")) {
                errorMessage.textContent = "Por favor, insira um email válido.";
                console.log("Validação falhou: email sem @");
                return;
            }
            try {
                errorMessage.textContent = "";
                successMessage.textContent = "";
                await registrarEmpresa(nome, cnpj, email, telefone);
                successMessage.textContent = "Empresa cadastrada com sucesso!";
                setTimeout(() => {
                    window.location.href = "menu.html";
                }, 2000);
            } catch (erro) {
                errorMessage.textContent = "Erro ao registrar empresa: " + erro.message;
            }
        });
    } else {
        console.error("Formulário de empresa não encontrado!");
    }
});