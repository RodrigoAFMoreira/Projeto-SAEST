import { auth, db } from "./firebase-config.js";
import {
  onAuthStateChanged,
  signOut
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import {
  doc,
  getDoc,
  collection,
  query,
  where,
  getDocs
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";

// Alternar entre abas
document.querySelectorAll(".tab-link").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tab-link").forEach(t => t.classList.remove("active"));
    document.querySelectorAll(".tab-content").forEach(c => c.classList.remove("active"));
    tab.classList.add("active");
    document.getElementById(`tab-${tab.dataset.tab}`).classList.add("active");
  });
});

// Preencher dados do usuário e certificações
onAuthStateChanged(auth, async (user) => {
  if (!user) {
    window.location.href = "../index.html";
    return;
  }

  document.getElementById("user-name").textContent = user.displayName || "Funcionário";
  document.getElementById("user-email").textContent = user.email;
  document.getElementById("info-nome").textContent = user.displayName || "Funcionário";
  document.getElementById("info-email").textContent = user.email;

  // Buscar EPIs vinculados ao usuário (exemplo usando email)
  const episRef = collection(db, "epis");
  const episSnap = await getDocs(query(episRef, where("emailFuncionario", "==", user.email)));
  const lista = document.getElementById("certificacoes-list");
  lista.innerHTML = "";

  if (episSnap.empty) {
    lista.innerHTML = "<li>Nenhuma certificação encontrada.</li>";
  } else {
    episSnap.forEach((doc) => {
      const e = doc.data();
      lista.innerHTML += `<li>${e.tipo || "Tipo não informado"} - Status: ${e.disponibilidade || "N/A"}</li>`;
    });
  }
});

// Botão de logout
document.getElementById("btn-sair").addEventListener("click", async () => {
  await signOut(auth);
  window.location.href = "../index.html";
});
