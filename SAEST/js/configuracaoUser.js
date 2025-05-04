
document.getElementById("settings-form").addEventListener("submit", function(event) {
  event.preventDefault();

  const emailNovo = document.getElementById("email").value;
  const senha = document.getElementById("senha").value;

//Validação
  if (!validateEmail(emailNovo)) {
    alert("Por favor, insira um e-mail válido.");
    return;
  }


  const user = firebase.auth().currentUser;
  
  if (user) {
    const credenciais = firebase.auth.EmailAuthProvider.credential(user.email, senha);

    user.reauthenticateWithCredential(credenciais)
      .then(() => {
        user.updateEmail(emailNovo)
          .then(() => {
            alert("E-mail atualizado com sucesso!");
            document.querySelector(".user-profile .email").textContent = emailNovo; // Atualiza o e-mail no perfil
          })
          .catch((error) => {
            console.error(error);
            alert("Erro ao atualizar o e-mail.");
          });
      })
      .catch((error) => {
        console.error(error);
        alert("Erro de autenticação. Verifique a senha.");
      });
  }
});

// Função para validar o formato do e-mail
function validateEmail(email) {
  const re = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,4}$/;
  return re.test(String(email).toLowerCase());
}

// Função para logout
function logout() {
  firebase.auth().signOut().then(() => {
    window.location.href = '/login'; 
  }).catch((error) => {
    console.error(error);
    alert("Erro ao sair.");
  });
}
