import { auth, db, storage } from './firebase-config.js';
import { addDoc, collection, deleteDoc, doc, getDocs, query, where, serverTimestamp } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-storage.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js';

let form = null;
let mensagem = null;
let tabela = null;
let userUID = null;
let userRole = null;
let userEmail = null;

document.addEventListener('DOMContentLoaded', () => {
  console.log('DOM carregado');
  form = document.getElementById('novo-documento-modal');
  mensagem = document.getElementById('mensagem');
  tabela = document.getElementById('tabela-documentos');

  console.log('Formulário encontrado:', !!form);
  console.log('Elemento mensagem encontrado:', !!mensagem);
  console.log('Elemento tabela encontrado:', !!tabela);

  if (!form) console.error('Formulário com ID "novo-documento-modal" não encontrado');
  if (!mensagem) console.error('Elemento com ID "mensagem" não encontrado');
  if (!tabela) console.error('Elemento com ID "tabela-documentos" não encontrado');

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
      await obterRoleUsuario(userUID);
      console.log('Role do usuário:', userRole);
      configurarCamposPorRole();
      await carregarObras();
      await carregarTabela();
    } catch (e) {
      console.error('Erro na inicialização:', e.code, e.message);
      if (mensagem) mensagem.textContent = `Erro na inicialização: ${e.message}`;
    }
  });
});

async function obterRoleUsuario(uid) {
  try {
    const snapshot = await getDocs(query(collection(db, 'usuarios'), where('uid', '==', uid)));
    userRole = snapshot.empty ? 'funcionario' : snapshot.docs[0].data().role;
    console.log('Role obtida:', userRole);
  } catch (e) {
    console.error('Erro ao obter role do usuário:', e.code, e.message);
    userRole = 'funcionario'; // Valor padrão em caso de erro
  }
}

function configurarCamposPorRole() {
  const grupoTipo = document.getElementById('grupo-tipo');
  const grupoObra = document.getElementById('grupo-obra');
  if (!grupoTipo || !grupoObra) {
    console.error('Elementos grupo-tipo ou grupo-obra não encontrados');
    return;
  }
  esconderCampos();

  if (userRole === 'funcionario') {
    grupoTipo.style.display = 'block';
    const funcionarioInput = document.getElementById('funcionario');
    if (funcionarioInput) {
      funcionarioInput.value = userEmail || '';
      console.log('Campo funcionario preenchido com:', userEmail);
    }
  } else {
    grupoObra.style.display = 'block';
    console.log('Exibindo campo de obra');
  }
}

function esconderCampos() {
  ['grupo-tipo', 'grupo-obra'].forEach(id => {
    const el = document.getElementById(id);
    if (el) {
      el.style.display = 'none';
      console.log(`Campo ${id} escondido`);
    }
  });
}

if (form) {
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (mensagem) {
      mensagem.textContent = '';
      mensagem.style.color = 'red';
    }

    if (!userUID) {
      console.error('userUID não definido, não é possível salvar documento');
      if (mensagem) mensagem.textContent = 'Usuário não autenticado.';
      return;
    }

    const funcionario = document.getElementById('funcionario')?.value.trim() || '';
    const tipo = document.getElementById('tipo')?.value.trim() || '';
    const obra = document.getElementById('obra')?.value || '';
    const dataEmissao = document.getElementById('data-emissao')?.value || '';
    const dataValidade = document.getElementById('data-validade')?.value || null;
    const arquivo = document.getElementById('arquivo')?.files[0];

    const categoria = userRole === 'funcionario' ? 'certificacao' : 'documento-obra';
    console.log('Dados do formulário:', { funcionario, tipo, obra, dataEmissao, dataValidade, arquivo, categoria, userUID });

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

    if (categoria === 'certificacao' && !tipo) {
      console.error('Tipo de certificação não selecionado');
      if (mensagem) mensagem.textContent = 'Selecione o tipo de certificação.';
      return;
    }

    if (categoria === 'documento-obra' && !obra) {
      console.error('Obra não selecionada');
      if (mensagem) mensagem.textContent = 'Selecione a obra.';
      return;
    }

    try {
      const nomeUnico = `${categoria}-${Date.now()}.pdf`;
      const storageRef = ref(storage, `certificacoes/${userUID}/${nomeUnico}`);
      console.log('Iniciando upload para:', storageRef.fullPath);
      await uploadBytes(storageRef, arquivo);
      console.log('Upload concluído');
      const url = await getDownloadURL(storageRef);
      console.log('URL do arquivo:', url);

      const docData = {
        categoria,
        dataEmissao,
        dataValidade,
        url,
        nomeArquivo: arquivo.name,
        uid: userUID,
        criadoEm: serverTimestamp()
      };

      if (categoria === 'certificacao') {
        docData.funcionario = funcionario;
        docData.tipo = tipo;
      } else {
        docData.obraId = obra;
      }

      console.log('Dados a serem salvos:', docData);
      const docRef = await addDoc(collection(db, 'documentosCertificacoes'), docData);
      console.log('Documento salvo com ID:', docRef.id);

      if (mensagem) {
        mensagem.style.color = 'green';
        mensagem.textContent = 'Documento enviado com sucesso!';
      }
      form.reset();
      esconderCampos();
      configurarCamposPorRole();
      await carregarTabela();
      console.log('Tabela recarregada após salvamento');
    } catch (e) {
      console.error('Erro ao salvar documento:', e.code, e.message);
      if (mensagem) mensagem.textContent = `Erro ao enviar o documento: ${e.message}`;
    }
  });
}

async function carregarObras() {
  const obraSelect = document.getElementById('obra');
  if (!obraSelect) {
    console.error('Elemento <select> com ID "obra" não encontrado');
    return;
  }
  obraSelect.innerHTML = '<option value="">Selecione a obra</option>';
  console.log('Select resetado:', obraSelect.innerHTML);

  if (!userUID) {
    console.error('userUID não definido, não é possível carregar obras');
    obraSelect.innerHTML = '<option value="">Usuário não autenticado</option>';
    return;
  }

  try {
    console.log('Iniciando carregamento de obras com userUID:', userUID);
    const snapshot = await getDocs(collection(db, 'obras'));
    console.log('Obras encontradas:', snapshot.size, snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    if (snapshot.empty) {
      console.log('Nenhuma obra encontrada na coleção "obras"');
      obraSelect.innerHTML = '<option value="">Nenhuma obra disponível</option>';
      return;
    }

    snapshot.forEach(doc => {
      const option = document.createElement('option');
      option.value = doc.id;
      option.textContent = doc.data().endereco || `Obra ${doc.id}`;
      obraSelect.appendChild(option);
      console.log('Adicionada obra:', doc.id, option.textContent);
    });
    console.log('Select atualizado:', obraSelect.innerHTML);
  } catch (e) {
    console.error('Erro ao carregar obras:', e.code, e.message);
    obraSelect.innerHTML = `<option value="">Erro ao carregar obras: ${e.message}</option>`;
  }
}

async function carregarTabela() {
  if (!tabela) {
    console.error('Elemento tabela-documentos não encontrado');
    return;
  }
  tabela.innerHTML = `<tr><td colspan="4"><div class="loading-spinner"></div></td></tr>`;
  console.log('Tabela resetada para loading');

  if (!userUID) {
    console.error('userUID não definido, não é possível carregar documentos');
    tabela.innerHTML = '<tr><td colspan="4">Usuário não autenticado.</td></tr>';
    return;
  }

  try {
    console.log('Iniciando consulta à coleção documentosCertificacoes com userUID:', userUID);
    const snapshot = await getDocs(query(collection(db, 'documentosCertificacoes'), where('uid', '==', userUID)));
    console.log('Documentos encontrados:', snapshot.size, snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    
    if (snapshot.empty) {
      console.log('Nenhum documento encontrado para o userUID:', userUID);
      tabela.innerHTML = '<tr><td colspan="4">Nenhum documento enviado.</td></tr>';
      return;
    }

    tabela.innerHTML = '';
    snapshot.forEach(docItem => {
      const d = docItem.data();
      console.log('Renderizando documento:', d);
      const tr = document.createElement('tr');
      tr.innerHTML = `
        <td>${d.categoria === 'certificacao' ? d.tipo : 'Documento de Obra'}</td>
        <td>${d.dataEmissao || '-'}</td>
        <td>${d.obraId || d.funcionario || '-'}</td>
        <td>
          <div class="acoes">
            <a href="${d.url}" target="_blank" title="Visualizar">
              <button class="icon-button"><i class="ri-eye-line"></i></button>
            </a>
            <a href="${d.url}" download title="Baixar">
              <button class="icon-button"><i class="ri-download-line"></i></button>
            </a>
            <button title="Apagar" class="icon-button" onclick="removerDocumento('${docItem.id}', '${d.url}')">
              <i class="ri-delete-bin-line"></i>
            </button>
          </div>
        </td>
      `;
      tabela.appendChild(tr);
    });
    console.log('Tabela renderizada:', tabela.innerHTML);
  } catch (e) {
    console.error('Erro ao carregar documentos:', e.code, e.message);
    tabela.innerHTML = `<tr><td colspan="4">Erro ao listar documentos: ${e.message}</td></tr>`;
  }
}

window.removerDocumento = async (docId, fileUrl) => {
  if (!confirm('Deseja mesmo remover este documento?')) return;
  try {
    console.log('Removendo documento:', docId, fileUrl);
    await deleteObject(ref(storage, fileUrl));
    await deleteDoc(doc(db, 'documentosCertificacoes', docId));
    console.log('Documento removido com sucesso');
    await carregarTabela();
  } catch (e) {
    console.error('Erro ao remover documento:', e.code, e.message);
    alert(`Erro ao remover o documento: ${e.message}`);
  }
};