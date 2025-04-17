import { getAuth, applyActionCode } from "https://www.gstatic.com/firebasejs/10.8.1/firebase-auth.js";
import { auth, applyActionCode } from "../scripts/firebase/configuracoes";

const urlParams = new URLSearchParams(window.location.search);
const oobCode = urlParams.get('oobCode');

if (oobCode) {
  applyActionCode(auth, oobCode)
    .then(() => {
      console.log("E-mail verificado com sucesso!");
      setTimeout(() => {
        window.location.href = "login.html";
      }, 5000);
    })
    .catch((error) => {
      console.error("Erro ao verificar e-mail:", error);
      alert("Houve um problema ao verificar seu e-mail. Tente novamente.");
    });
}
