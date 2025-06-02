import { db, storage } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
  ref,
  uploadBytes,
  getDownloadURL,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js";

console.log("cadastroObras.js carregado");

const carregarEmpresas = async () => {
  const selectEmpresa = document.getElementById("empresa");
  try {
    const querySnapshot = await getDocs(collection(db, "empresas"));
    selectEmpresa.innerHTML = '<option value="" disabled selected>Selecione uma empresa</option>';
    if (querySnapshot.empty) {
      console.warn("Nenhuma empresa encontrada no Firestore.");
      selectEmpresa.innerHTML += '<option value="" disabled>Nenhuma empresa disponível</option>';
    } else {
      querySnapshot.forEach((doc) => {
        const dados = doc.data();
        const option = document.createElement("option");
        option.value = doc.id;
        option.textContent = dados.razaoSocial || "Empresa sem nome";
        selectEmpresa.appendChild(option);
      });
    }
  } catch (erro) {
    console.error("Erro ao carregar empresas:", erro);
    document.getElementById("error-message").textContent = "Erro ao carregar empresas.";
  }
};

const uploadPDF = async (file, path) => {
  if (!file) return null;
  if (file.type !== "application/pdf") {
    throw new Error("Arquivo deve ser um PDF.");
  }
  if (file.size > 5 * 1024 * 1024) { // Limit to 5MB
    throw new Error("O arquivo deve ter no máximo 5MB.");
  }
  const storageRef = ref(storage, path);
  await uploadBytes(storageRef, file);
  return await getDownloadURL(storageRef);
};

const registrarObra = async (obraData) => {
  try {
    console.log("Registrando obra com dados:", obraData);
    const alvaraURL = await uploadPDF(obraData.alvara, `obras/${obraData.endereco}/alvara.pdf`);
    const registroCreaURL = await uploadPDF(obraData.registro_crea, `obras/${obraData.endereco}/registro_crea.pdf`);
    const registroCalURL = await uploadPDF(obraData.registro_cal, `obras/${obraData.endereco}/registro_cal.pdf`);

    await addDoc(collection(db, "obras"), {
      endereco: obraData.endereco,
      alvara: alvaraURL,
      registro_crea: registroCreaURL,
      registro_cal: registroCalURL,
      responsavel_tecnico: obraData.responsavel_tecnico,
      empresaId: obraData.empresaId,
      status: "ativa",
      criadoEm: new Date(),
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
  const modal = document.getElementById("confirmation-modal");
  const confirmYes = document.getElementById("confirmYes");
  const confirmNo = document.getElementById("confirmNo");
  const btnSalvar = document.getElementById("confirmar-salvar");
  const closeModal = document.querySelector(".close");

  if (obraForm) {
    console.log("Formulário de obra encontrado, adicionando listeners");

    btnSalvar.addEventListener("click", () => {
      modal.style.display = "block";
    });

    confirmYes.addEventListener("click", () => {
      modal.style.display = "none";
      obraForm.dispatchEvent(new Event("submit", { cancelable: true }));
    });

    confirmNo.addEventListener("click", () => {
      modal.style.display = "none";
    });

    closeModal.addEventListener("click", () => {
      modal.style.display = "none";
    });

    window.addEventListener("click", (event) => {
      if (event.target === modal) {
        modal.style.display = "none";
      }
    });

    obraForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      errorMessage.textContent = "";
      successMessage.textContent = "";

      const obraData = {
        endereco: document.getElementById("endereco").value.trim(),
        alvara: document.getElementById("alvara").files[0],
        registro_crea: document.getElementById("registro_crea").files[0],
        registro_cal: document.getElementById("registro_cal").files[0],
        responsavel_tecnico: document.getElementById("responsavel_tecnico").value.trim(),
        empresaId: document.getElementById("empresa").value,
      };

      if (!obraData.endereco) {
        errorMessage.textContent = "Por favor, insira o endereço.";
        return;
      }
      if (!obraData.alvara) {
        errorMessage.textContent = "Por favor, selecione o arquivo do alvará (PDF).";
        return;
      }
      if (!obraData.registro_crea) {
        errorMessage.textContent = "Por favor, selecione o arquivo do registro CREA (PDF).";
        return;
      }
      if (!obraData.registro_cal) {
        errorMessage.textContent = "Por favor, selecione o arquivo do registro CAL (PDF).";
        return;
      }
      if (!obraData.responsavel_tecnico) {
        errorMessage.textContent = "Por favor, insira o nome do responsável técnico.";
        return;
      }
      if (!obraData.empresaId) {
        errorMessage.textContent = "Por favor, selecione uma construtora.";
        return;
      }

      try {
        successMessage.textContent = "Cadastrando obra...";
        await registrarObra(obraData);
        successMessage.textContent = "Obra cadastrada com sucesso!";
        obraForm.reset();
        setTimeout(() => {
          window.location.href = "menu.html";
        }, 2000);
      } catch (erro) {
        errorMessage.textContent = `Erro ao registrar obra: ${erro.message}`;
        successMessage.textContent = "";
      }
    });
  } else {
    console.error("Formulário de obra não encontrado!");
  }
});