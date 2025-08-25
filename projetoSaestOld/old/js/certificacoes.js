import { auth, db, storage } from './firebase-config.js';
import { addDoc, collection, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';

let form = null;
let mensagem = null;
let tabela = null;
let userUID = null;
let userEmail = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado');
  form = document.getElementById('novo-certificado-form');
  mensagem = document.getElementById('mensagem');
  tabela = document.getElementById('tabela-certificados');

  console.log('Formulário encontrado:', !!form);
  console.log('Elemento mensagem encontrado:', !!mensagem);
  console.log('Elemento tabela encontrado:', !!tabela);

  if (!form) console.error('Formulário com ID "novo-certificado-form" não encontrado');
  if (!mensagem) console.error('Elemento com ID "mensagem" não encontrado');
  if (!tabela) console.error('Elemento com ID "tabela-certificados" não encontrado');

  onAuthStateChanged(auth, async (user) => {
    console.log('Estado de autenticação:', user ? 'Autenticado' : 'Não autenticado', user?.uid);
    if (!user) {
      console.log('Redirecionando para login.html');
      return location.href = 'login.html';
    }
    userUID = user.uid;
    userEmail = user.email;
    console.log('Usuário autenticado:', { userUID, userEmail });

    try {
      const userEmailElement = document.getElementById('user-email');
      if (userEmailElement) userEmailElement.textContent = userEmail;
      configurarCampos();
      await carregarTabela();
    } catch (e) {
      console.error('Erro na inicialização:', e.code, e.message);
      if (mensagem) mensagem.textContent = `Erro na inicialização: ${e.message}`;
    }
  });
});

function configurarCampos() {
  const grupoTipo = document.getElementById('grupo-tipo');
  const funcionarioInput = document.getElementById('funcionario');
  if (!grupoTipo || !funcionarioInput) {
    console.error('Elementos grupo-tipo ou funcionario não encontrados');
    return;
  }
  grupoTipo.style.display = 'block';
  funcionarioInput.value = userEmail || '';
  console.log('Campo funcionario preenchido com:', userEmail);
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (mensagem) {
      mensagem.textContent = '';
      mensagem.style.color = 'red';
    }

    if (!userUID) {
      console.error('userUID não definido, não é possível salvar certificado');
      if (mensagem) mensagem.textContent = 'Usuário não autenticado.';
      return;
    }

    const funcionario = document.getElementById('funcionario')?.value.trim() || '';
    const tipo = document.getElementById('tipo')?.value.trim() || '';
    const dataEmissao = document.getElementById('data-emissao')?.value || '';
    const dataValidade = document.getElementById('data-validade')?.value || null;
    const arquivo = document.getElementById('arquivo')?.files[0];

    console.log('Dados do formulário:', { funcionario, tipo, dataEmissao, dataValidade, arquivo });

    if (!arquivo || !arquivo.name.endsWith('.pdf')) {
      console.error('Arquivo inválido, deve ser PDF');
      if (mensagem) mensagem.textContent = 'O arquivo deve ser um PDF.';
      return;
    }

    if (arquivo.size > 2 * 1024 * 1024) {
      console.error('Arquivo excede 2MB');
      if (mensagem) mensagem.textContent = 'O PDF não pode exceder 2MB.';
      return;
    }

    if (!tipo) {
      console.error('Tipo de certificação não selecionado');
      if (mensagem) mensagem.textContent = 'Selecione o tipo de certificação.';
      return;
    }

    try {
      const nomeUnico = `certificacao-${Date.now()}.pdf`;
      const storageRef = ref(storage, `certificacoes/${userUID}/${nomeUnico}`);
      console.log('Iniciando upload para:', storageRef.fullPath);
      await uploadBytes(storageRef, arquivo);
      console.log('Upload concluído');
      const url = await getDownloadURL(storageRef);
      console.log('URL do arquivo:', url);

      const docData = {
        categoria: 'certificacao',
        funcionario,
        tipo,
        dataEmissao,
        dataValidade,
        url,
        nomeArquivo: arquivo.name,
        uid: userUID,
        criadoEm: serverTimestamp()
      };

      console.log('Dados a serem salvos:', docData);
      const docRef = await addDoc(collection(db, 'documentosCertificacoes'), docData);
      console.log('Certificado salvo com ID:', docRef.id);

      if (mensagem) {
        mensagem.style.color = 'green';
        mensagem.textContent = 'Certificado enviado com sucesso!';
      }
      form.reset();
      configurarCampos();
      await carregarTabela();
      console.log('Tabela recarregada após salvamento');
      document.getElementById('novo-certificado-modal').style.display = 'none';
    } catch (e) {
      console.error('Erro ao salvar certificado:', e.code, e.message);
      if (mensagem) mensagem.textContent = `Erro ao enviar o certificado: ${e.message}`;
    }
  });
}

async function carregarTabela() {
  if (!tabela) {
    console.error('Elemento tabela-certificados não encontrado');
    return;
  }
  tabela.innerHTML = `<tr><td colspan="4"><div class="loading-spinner"></div></td></tr>`;
  console.log('Tabela resetada para loading');

  if (!userUID) {
    console.error('userUID não definido, não é possível carregar certificados');
    tabela.innerHTML = '<tr><td colspan="4">Usuário não autenticado.</td></tr>';
    return;
  }

  try {
    console.log('Iniciando consulta à coleção documentosCertificacoes com userUID:', userUID);
    const snapshot = await getDocs(query(collection(db, 'documentosCertificacoes'), where('uid', '==', userUID), where('categoria', '==', 'certificacao')));
    console.log('Certificados encontrados:', snapshot.size, snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    if (snapshot.empty) {
      console.log('Nenhum certificado encontrado para o userUID:', userUID);
      tabela.innerHTML = '<tr><td colspan="4">Nenhum certificado enviado.</td></tr>';
      return;
    }

    tabela.innerHTML = '';
    snapshot.forEach(docItem => {
      const d = docItem.data();
      console.log('Renderizando certificado:', d);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.tipo}</td>
        <td>${d.dataEmissao || '-'}</td>
        <td>${d.dataValidade || '-'}</td>
        <td>
          <div class="acoes">
            <a href="${d.url}" target="_blank" title="Visualizar">
              <button class="icon-button"><i class="ri-eye-line"></i></button>
            </a>
            <a href="${d.url}" download title="Baixar">
              <button class="icon-button"><i class="ri-download-line"></i></button>
            </a>
            <button title="Apagar" class="icon-button" onclick="removerCertificado('${docItem.id}', '${d.url}')">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </td>
      `;
      tabela.appendChild(tr);
    });
    console.log('Tabela renderizada:', tabela.innerHTML);
  } catch (e) {
    console.error('Erro ao carregar certificados:', e.code, e.message);
    tabela.innerHTML = `<tr><td colspan="4">Erro ao listar certificados: ${e.message}</td></tr>`;
  }
}

window.removerCertificado = async (docId, fileUrl) => {
  if (!confirm('Deseja mesmo remover este certificado?')) return;
  try {
    console.log('Removendo certificado:', docId, fileUrl);
    await deleteObject(ref(storage, fileUrl));
    await deleteDoc(doc(db, 'documentosCertificacoes', docId));
    console.log('Certificado removido com sucesso');
    await carregarTabela();
  } catch (e) {
    console.error('Erro ao remover certificado:', e.code, e.message);
    alert(`Erro ao remover o certificado: ${e.message}`);
  }
};