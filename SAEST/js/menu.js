import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";

onAuthStateChanged(auth, async (user) => {
    if (!user) {
        window.location.href = "login.html"; 
    } else {
        console.log("Usuário logado:", user.uid);
        await loadUsers(); 
    }
});

async function loadUsers() {
    try {
        const usersCollection = collection(db, "users");
        const usersSnapshot = await getDocs(usersCollection);
        const usersList = document.getElementById("users-list");
        usersList.innerHTML = ""; 

        if (usersSnapshot.empty) {
            usersList.innerHTML = "<li>Nenhum usuário encontrado.</li>";
        } else {
            usersSnapshot.forEach((doc) => {
                const userData = doc.data();
                const li = document.createElement("li");
                li.textContent = `Email: ${userData.email}, Nome: ${userData.username}, Criado Em: ${userData.criadoEm.toDate().toLocaleString()}`;
                usersList.appendChild(li);
            });
        }
    } catch (error) {
        console.error("Erro ao buscar usuários:", error);
        document.getElementById("users-list").innerHTML = "<li>Erro ao carregar usuários: " + error.message + "</li>";
    }
}

document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    }).catch((error) => {
        console.error("Erro ao deslogar:", error);
        alert("Erro ao deslogar: " + error.message);
    });
});
