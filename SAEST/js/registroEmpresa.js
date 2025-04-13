import { db } from "./firebase-config.js";
import { collection, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

const formatarTelefone = (telefone) => {
  return telefone.replace(/\D/g, '');
};

const registrarEmpresa = async (dados) => {
  try {
    await addDoc(collection(db, "empresas"), {
      razaoSocial: dados.razaoSocial,
      nomeFantasia: dados.nomeFantasia,
      email: dados.email,
      porte: dados.porte,
      telefone: formatarTelefone(dados.telefone),
      criadoEm: serverTimestamp()
    });
    return true;
  } catch (erro) {
    console.error("Erro no cadastro:", erro);
    throw new Error("Erro ao cadastrar empresa. Tente novamente.");
  }
};

document.addEventListener("DOMContentLoaded", () => {
  const companyForm = document.getElementById("company-form");
  const errorMessage = document.getElementById("error-message");
  const successMessage = document.getElementById("success-message");
  const voltarBtn = document.getElementById("voltar-btn");

  document.getElementById('telefone')?.addEventListener('input', function(e) {
    let value = e.target.value.replace(/\D/g, '');
    if (value.length > 10) {
      value = value.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    } else if (value.length > 6) {
      value = value.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
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
    e.target.value = value.substring(0, 15);
  });

  voltarBtn?.addEventListener('click', () => {
    window.history.back();
  });

  companyForm?.addEventListener("submit", async (e) => {
    e.preventDefault();

    const dados = {
      razaoSocial: document.getElementById("razao-social").value.trim(),
      nomeFantasia: document.getElementById("nome-fantasia").value.trim(),
      email: document.getElementById("email").value.trim(),
      porte: document.getElementById("porte").value,
      telefone: document.getElementById("telefone").value
    };

    if (!dados.razaoSocial || !dados.nomeFantasia) {
      errorMessage.textContent = "Razão Social e Nome Fantasia são obrigatórios";
      return;
    }

    if (!dados.email.includes('@') || !dados.email.includes('.')) {
      errorMessage.textContent = "Por favor, insira um e-mail válido";
      return;
    }

    if (!dados.porte) {
      errorMessage.textContent = "Selecione o porte da empresa";
      return;
    }

    if (formatarTelefone(dados.telefone).length < 11) {
      errorMessage.textContent = "Telefone inválido (inclua DDD e 9º dígito)";
      return;
    }

    try {
      errorMessage.textContent = "";
      successMessage.textContent = "Cadastrando empresa...";

      await registrarEmpresa(dados);

      successMessage.textContent = "Empresa cadastrada com sucesso!";
      companyForm.reset();

      setTimeout(() => {
        window.location.href = "menu.html";
      }, 1500);

    } catch (erro) {
      errorMessage.textContent = erro.message;
      successMessage.textContent = "";
    }
  });
});
