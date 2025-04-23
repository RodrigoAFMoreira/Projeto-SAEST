import { auth } from './firebase-config.js';
import { updateEmail, updateProfile, signOut } from 'firebase/auth';

document.getElementById('settings-form').addEventListener('submit', async (e) => {
  e.preventDefault();

  const user = auth.currentUser;
  const nome = document.getElementById('nome').value;
  const telefone = document.getElementById('telefone').value;
  const novoEmail = document.getElementById('email').value;
  const senha = document.getElementById('senha').value;

  try {
    if (user) {
      if (user.email !== novoEmail) {
        await updateEmail(user, novoEmail);
      }

      await updateProfile(user, {
        displayName: nome,
        phoneNumber: telefone
      });

      alert('Informações atualizadas com sucesso!');
    }
  } catch (error) {
    console.error('Erro ao atualizar:', error.message);
    alert('Erro: ' + error.message);
  }
});

window.logout = function () {
  signOut(auth)
    .then(() => {
      window.location.href = '../html/login.html';
    })
    .catch((error) => {
      console.error('Erro ao sair:', error.message);
    });
};