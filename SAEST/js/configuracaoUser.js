import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, EmailAuthProvider, reauthenticateWithCredential, updateEmail, deleteUser } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { doc, getDoc, updateDoc, deleteDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Função para validar o formato do e-mail
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return re.test(String(email).toLowerCase());
}

// Função para validar o formato do telefone 
function validateTelefone(telefone) {
  const regexTelefone = /^\(\d{2}\)\s?9\d{4}-\d{4}$/;
  if (!telefone) return "O campo telefone é obrigatório.";
  if (!regexTelefone.test(telefone)) return "Digite um telefone válido (ex: (11) 91234-5678).";
  return null;
}

// Função para mostrar/esconder o loading
function showLoading(show) {
  const loadingDiv = document.querySelector(".loading") || document.createElement("div");
  if (!loadingDiv.classList.contains("loading")) {
    loadingDiv.className = "loading";
    loadingDiv.textContent = "Carregando...";
    document.body.appendChild(loadingDiv);
  }
  loadingDiv.style.display = show ? "block" : "none";
}

// Função para mostrar o card de sucesso
function showSuccessCard() {
  const successCard = document.getElementById("success-card");
  if (successCard) {
    successCard.style.display = "block";
    setTimeout(() => {
      successCard.style.display = "none";
    }, 4000); // Auto-close after 4 seconds
  }
}

// Ajusta o menu lateral com base no perfil
function ajustarMenuPorPerfil(perfil) {
  const configuracoesLink = document.querySelector(".configuracoes-link");
  const usuariosLink = document.querySelector(".usuarios-link");

  if (perfil === "gestor") {
    if (configuracoesLink) configuracoesLink.parentElement.style.display = "none";
    if (usuariosLink) usuariosLink.parentElement.style.display = "none";
  } else if (perfil === "admin") {
    if (configuracoesLink) configuracoesLink.parentElement.style.display = "block";
    if (usuariosLink) usuariosLink.parentElement.style.display = "block";
  } else {
    if (configuracoesLink) configuracoesLink.parentElement.style.display = "none";
    if (usuariosLink) usuariosLink.parentElement.style.display = "none";
  }
}

// Função para carregar dados do usuário
async function loadUserData(user) {
  const nomeInput = document.getElementById("nome");
  const emailInput = document.getElementById("email");
  const telefoneInput = document.getElementById("telefone");
  const userNameDiv = document.querySelector(".user-profile .name");
  const userEmailDiv = document.querySelector(".user-profile .email");

  if (user) {
    if (userNameDiv) userNameDiv.textContent = user.displayName || "Usuário";
    if (userEmailDiv) userEmailDiv.textContent = user.email || "email@não.disponível";

    try {
      showLoading(true);
      const userDoc = await getDoc(doc(db, "users", user.uid));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log("Dados do usuário carregados:", userData);

        if (nomeInput) nomeInput.value = userData.username || "";
        if (emailInput) emailInput.value = userData.email || user.email;
        if (telefoneInput) telefoneInput.value = userData.telefone || "";

        const perfil = userData.perfil || userData.tipo;
        ajustarMenuPorPerfil(perfil);
      } else {
        console.warn("Documento do usuário não encontrado no Firestore.");
        if (nomeInput) nomeInput.value = "";
        if (emailInput) emailInput.value = user.email || "";
        if (telefoneInput) telefoneInput.value = "";
      }
    } catch (error) {
      console.error("Erro ao carregar dados do usuário:", error);
      alert("Erro ao carregar dados do usuário: " + error.message);
    } finally {
      showLoading(false);
    }
  }
}

// Função de logout
function logout() {
  showLoading(true);
  auth.signOut()
    .then(() => {
      console.log("Usuário deslogado.");
      window.location.href = "../index.html";
    })
    .catch((error) => {
      console.error("Erro ao deslogar:", error);
      alert("Erro ao sair da conta: " + error.message);
    })
    .finally(() => showLoading(false));
}

// Função para deletar conta
async function deleteAccount() {
  const user = auth.currentUser;
  const deletePassword = document.getElementById("delete-password").value;
  const confirmationCard = document.getElementById("delete-confirmation-card");

  if (!deletePassword) {
    alert("Por favor, insira a senha para confirmar a exclusão.");
    return;
  }

  try {
    showLoading(true);
    const credenciais = EmailAuthProvider.credential(user.email, deletePassword);
    await reauthenticateWithCredential(user, credenciais);
    await deleteDoc(doc(db, "users", user.uid));
    await deleteUser(user);
    confirmationCard.style.display = "none";
    window.location.href = "../index.html";
  } catch (error) {
    console.error("Erro ao deletar conta:", error);
    alert("Erro ao deletar conta: " + error.message);
  } finally {
    showLoading(false);
  }
}

// Função para atualizar dados após confirmação
async function updateUserData(nome, emailNovo, telefone, senha) {
  const user = auth.currentUser;
  const updateConfirmationCard = document.getElementById("update-confirmation-card");

  if (user) {
    try {
      showLoading(true);
      const credenciais = EmailAuthProvider.credential(user.email, senha);
      await reauthenticateWithCredential(user, credenciais);

      if (emailNovo !== user.email) {
        await updateEmail(user, emailNovo);
        console.log("E-mail atualizado no Firebase Authentication:", emailNovo);
      }

      await updateDoc(doc(db, "users", user.uid), {
        username: nome,
        email: emailNovo,
        telefone: telefone,
        atualizadoEm: new Date(),
      });
      console.log("Dados atualizados no Firestore:", { username: nome, email: emailNovo, telefone: telefone });

      // Atualiza apenas o e-mail no sidebar, não o nome
      const userEmailDiv = document.querySelector(".user-profile .email");
      if (userEmailDiv) userEmailDiv.textContent = emailNovo;

      updateConfirmationCard.style.display = "none";
      showSuccessCard();
    } catch (error) {
      console.error("Erro ao atualizar dados:", error);
      if (error.code === "auth/wrong-password") {
        alert("Senha incorreta. Verifique a senha atual.");
      } else if (error.code === "auth/email-already-in-use") {
        alert("Este e-mail já está em uso por outra conta.");
      } else {
        alert("Erro ao atualizar dados: " + error.message);
      }
    } finally {
      showLoading(false);
    }
  } else {
    alert("Nenhum usuário autenticado.");
  }
}

// Início: Adicionar event listeners
document.addEventListener("DOMContentLoaded", () => {
  // Listener para o botão de logout
  const logoutButton = document.getElementById("logout-button");
  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  } else {
    console.warn("Botão de logout não encontrado.");
  }

  // Listener para o botão de deletar conta
  const deleteButton = document.getElementById("delete-account-button");
  const deleteConfirmationCard = document.getElementById("delete-confirmation-card");
  const cancelDeleteButton = document.getElementById("cancel-delete-button");
  const confirmDeleteButton = document.getElementById("confirm-delete-button");

  if (deleteButton && deleteConfirmationCard) {
    deleteButton.addEventListener("click", () => {
      deleteConfirmationCard.style.display = "block";
      document.getElementById("delete-password").value = "";
    });
  } else {
    console.warn("Botão de deletar conta ou card de confirmação não encontrado.");
  }

  if (cancelDeleteButton) {
    cancelDeleteButton.addEventListener("click", () => {
      deleteConfirmationCard.style.display = "none";
    });
  }

  if (confirmDeleteButton) {
    confirmDeleteButton.addEventListener("click", deleteAccount);
  }

  // Listener para o formulário de configurações
  const settingsForm = document.getElementById("settings-form");
  const updateConfirmationCard = document.getElementById("update-confirmation-card");
  const cancelUpdateButton = document.getElementById("cancel-update-button");
  const confirmUpdateButton = document.getElementById("confirm-update-button");

  if (settingsForm && updateConfirmationCard) {
    settingsForm.addEventListener("submit", (event) => {
      event.preventDefault();

      const nome = document.getElementById("nome").value.trim();
      const emailNovo = document.getElementById("email").value.trim();
      const telefone = document.getElementById("telefone").value.trim();

      // Validações
      if (!validateEmail(emailNovo)) {
        alert("Por favor, insira um e-mail válido.");
        return;
      }
      if (nome === "") {
        alert("Por favor, insira um nome.");
        return;
      }
      const erroTelefone = validateTelefone(telefone);
      if (erroTelefone) {
        alert(erroTelefone);
        return;
      }

      // Armazena dados temporariamente no formulário para uso após confirmação
      settingsForm.dataset.nome = nome;
      settingsForm.dataset.email = emailNovo;
      settingsForm.dataset.telefone = telefone;

      updateConfirmationCard.style.display = "block";
      document.getElementById("update-password").value = "";
    });
  } else {
    console.warn("Formulário ou card de confirmação de atualização não encontrado.");
  }

  if (cancelUpdateButton) {
    cancelUpdateButton.addEventListener("click", () => {
      updateConfirmationCard.style.display = "none";
    });
  }

  if (confirmUpdateButton) {
    confirmUpdateButton.addEventListener("click", () => {
      const senha = document.getElementById("update-password").value;
      if (!senha) {
        alert("Por favor, insira a senha para confirmar as alterações.");
        return;
      }
      const nome = settingsForm.dataset.nome;
      const emailNovo = settingsForm.dataset.email;
      const telefone = settingsForm.dataset.telefone;
      updateUserData(nome, emailNovo, telefone, senha);
    });
  }

  // Monitora o estado de autenticação
  onAuthStateChanged(auth, (user) => {
    if (user) {
      console.log("Usuário logado:", user.uid);
      loadUserData(user);
    } else {
      console.log("Usuário não está logado, redirecionando para login.");
      window.location.href = "../index.html";
    }
  });
});