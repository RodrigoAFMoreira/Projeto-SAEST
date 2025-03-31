import { auth } from "./firebase-config.js";
import { onAuthStateChanged, signOut } from "firebase/auth";

onAuthStateChanged(auth, (user) => {
    if (!user) {
        window.location.href = "login.html"; // Redirecionar se nao logado.....
    }
});

document.getElementById("logout-btn").addEventListener("click", () => {
    signOut(auth).then(() => {
        window.location.href = "login.html";
    });
});
