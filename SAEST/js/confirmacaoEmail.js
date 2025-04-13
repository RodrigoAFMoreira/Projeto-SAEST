import { getAuth, applyActionCode } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-app.js";

// CONFIGURAÇÃO DO PROJETO FIREBASE
const firebaseConfig = {
  apiKey: "SUA_API_KEY",
  authDomain: "SEU_PROJETO.firebaseapp.com",
  projectId: "SEU_PROJETO",
  storageBucket: "SEU_PROJETO.appspot.com",
  messagingSenderId: "XXXXXX",
  appId: "XXXXXX"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// PEGAR O CÓDIGO DA URL
const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode');

// CONFIRMAR A VERIFICAÇÃO DO E-MAIL
if (oobCode) {
  applyActionCode(auth, oobCode)
    .then(() => {
      console.log("E-mail verificado com sucesso!");

      // Opcional: redirecionar após 5 segundos
      setTimeout(() => {
        window.location.href = "login.html";
      }, 5000);
    })
    .catch((error) => {
      console.error("Erro ao verificar e-mail:", error);
      alert("Houve um problema ao verificar seu e-mail. Tente novamente.");
    });
}
