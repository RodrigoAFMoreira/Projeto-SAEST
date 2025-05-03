import { redirecionarParaLogin } from "./redirecionar.js";

document.addEventListener("DOMContentLoaded", () => {
  const loginLink = document.getElementById("login-link");
  if (loginLink) {
    loginLink.addEventListener("click", (e) => {
      e.preventDefault();
      redirecionarParaLogin();
    });
  } else {
    console.error("Link de 'fazer login' não encontrado!");
  }
});