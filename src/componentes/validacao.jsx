export const validatePhoneNumber = (telefone) => {
  const regexTelefone = /^\(\d{2}\)\s?9\d{4}-\d{4}$/;
  if (!telefone) return "O campo telefone é obrigatório.";
  if (!regexTelefone.test(telefone)) return "Digite um telefone válido (ex: (11) 91234-5678).";
  return null;
};

export const validatePassword = (senha, email, nome) => {
  const erros = [];
  console.log('Validating password:', { senha, email, nome }); // Debugging

  if (!senha) {
    erros.push("A senha é obrigatória.");
    return erros;
  }

  if (senha.length < 8) erros.push("Mínimo de 8 caracteres.");
  if (!/[A-Z]/.test(senha)) erros.push("Deve conter ao menos 1 letra maiúscula.");
  if (!/[a-z]/.test(senha)) erros.push("Deve conter ao menos 1 letra minúscula.");
  if (!/[0-9]/.test(senha)) erros.push("Deve conter ao menos 1 número.");
  if (!/[^A-Za-z0-9]/.test(senha)) erros.push("Deve conter ao menos 1 caractere especial.");
  if (/(.)\1{2,}/.test(senha)) erros.push("Não repita o mesmo caractere em sequência (ex: aaa).");

  if (nome && nome.trim() && nome.length > 2) {
    const nomeLimpo = nome.toLowerCase().replace(/\s+/g, "").trim();
    if (senha.toLowerCase().includes(nomeLimpo)) {
      erros.push("A senha não deve conter seu nome.");
    }
  }

  if (email && email.trim() && email.includes('@') && email.split('@')[0].length > 2) {
    const emailParte = email.split('@')[0].toLowerCase().trim();
    if (emailParte.length > 3 && senha.toLowerCase().includes(emailParte)) {
      erros.push("A senha não deve conter a parte local do seu e-mail.");
    }
  }

  console.log('Password validation errors:', erros); // Debugging
  return erros;
};