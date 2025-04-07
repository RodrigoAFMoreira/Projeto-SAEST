import { auth } from "./firebase-config.js";
import { sendPasswordResetEmail } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("recuperar-form");
  const emailInput = document.getElementById("email");

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const email = emailInput.value.trim();

    if (!validateEmail(email)) {
      showFeedback("Por favor, insira um e-mail válido.", true);
      emailInput.focus();
      return;
    }

    // Feedback de carregamento
    const submitBtn = form.querySelector("button[type='submit']");
    submitBtn.disabled = true;
    submitBtn.textContent = "Enviando...";

    try {
      await sendPasswordResetEmail(auth, email);
      showFeedback("✓ E-mail de recuperação enviado com sucesso!");
      form.reset();

      // Redireciona para o login após 3 segundos
      setTimeout(() => {
        window.location.href = "login.html";
      }, 3000);
    } catch (error) {
      console.error("Erro ao enviar e-mail de recuperação:", error.code);
      let msg = "Erro ao enviar o e-mail. Tente novamente.";

      if (error.code === "auth/user-not-found") {
        msg = "Este e-mail não está cadastrado.";
      } else if (error.code === "auth/too-many-requests") {
        msg = "Muitas tentativas. Tente mais tarde.";
      }

      showFeedback(msg, true);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "Enviar link de Recuperação";
    }
  });

  function validateEmail(email) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  function showFeedback(message, isError = false) {

    const existing = form.querySelector(".feedback");
    if (existing) existing.remove();

    const div = document.createElement("div");
    div.className = `feedback ${isError ? "error" : "success"}`;
    div.textContent = message;
    form.appendChild(div);

    if (!isError) {
      setTimeout(() => div.remove(), 5000);
    }
  }
});