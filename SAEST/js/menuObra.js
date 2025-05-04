// menuObra tem interface para cadastro, edição e exclusão de obras, 
// Ele renderiza uma tabela de obras com detalhes expansíveis, 
// carrega empresas para associação, valida formulários de criação e edição exibidos em modais, e suporta navegação responsiva
//  Logs rastreiam erros e interações
import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc, addDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
    redirecionarParaMenu,
    redirecionarParaMenuEmpresa,
    redirecionarParaObras,
    redirecionarParaConfiguracoes 
} from './redirecionar.js';

// Configura eventos após carregamento do DOM
document.addEventListener('DOMContentLoaded', () => {
  const sidebar = document.getElementById('sidebar');
  const obraForm = document.getElementById('obra-form');
  const editObraForm = document.getElementById('edit-obra-form');

  // Fecha sidebar em telas pequenas ao clicar em itens
  if (sidebar) {
    const sidebarItems = sidebar.querySelectorAll('li:not(.dashboard-link)');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
      });
    });
  }

  // Carrega empresas para preencher campo select
  const carregarEmpresas = async (selectElementId) => {
    const selectEmpresa = document.getElementById(selectElementId);
    try {
      const querySnapshot = await getDocs(collection(db, "empresas"));
      selectEmpresa.innerHTML = '<option value="" disabled selected>Selecione uma empresa</option>';
      if (querySnapshot.empty) {
        console.warn("Nenhuma empresa encontrada no Firestore.");
        selectEmpresa.innerHTML = '<option value="" disabled selected>Nenhuma empresa disponível</option>';
      } else {
        querySnapshot.forEach((doc) => {
          const dados = doc.data();
          const option = document.createElement("option");
          option.value = doc.id;
          option.textContent = dados.razaoSocial || "Empresa sem nome";
          selectEmpresa.appendChild(option);
        });
      }
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      const errorMessage = selectElementId === 'empresa' ? 'error-message' : 'edit-error-message';
      document.getElementById(errorMessage).textContent = "Erro ao carregar empresas.";
    }
  };

  // Manipula submissão do formulário de cadastro de obra
  if (obraForm) {
    carregarEmpresas('empresa');
    obraForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorMessage = document.getElementById('error-message');
      const successMessage = document.getElementById('success-message');
      const modal = document.getElementById('modalObra');
      errorMessage.textContent = '';
      successMessage.textContent = '';

      // Coleta dados do formulário
      const obraData = {
        endereco: document.getElementById('endereco').value.trim(),
        status: document.getElementById('status').value,
        dataInicio: document.getElementById('data-inicio').value,
        dataTermino: document.getElementById('data-termino').value || null,
        responsavelTecnico: document.getElementById('responsavel-tecnico').value.trim(),
        alvara: document.getElementById('alvara').value.trim(),
        registroCrea: document.getElementById('registro-crea').value.trim(),
        registroCal: document.getElementById('registro-cal').value.trim(),
        empresaId: document.getElementById('empresa').value,
        criadoEm: new Date()
      };

      // Valida campos obrigatórios
      if (!obraData.endereco) {
        errorMessage.textContent = "Por favor, insira o endereço.";
        return;
      }
      if (!obraData.status) {
        errorMessage.textContent = "Por favor, selecione o status.";
        return;
      }
      if (!obraData.dataInicio) {
        errorMessage.textContent = "Por favor, insira a data de início.";
        return;
      }
      if (!obraData.responsavelTecnico) {
        errorMessage.textContent = "Por favor, insira o responsável técnico.";
        return;
      }
      if (!obraData.alvara) {
        errorMessage.textContent = "Por favor, insira o alvará.";
        return;
      }
      if (!obraData.registroCrea) {
        errorMessage.textContent = "Por favor, insira o registro no CREA.";
        return;
      }
      if (!obraData.registroCal) {
        errorMessage.textContent = "Por favor, insira o registro no CAL.";
        return;
      }
      if (!obraData.empresaId) {
        errorMessage.textContent = "Por favor, selecione uma construtora.";
        return;
      }

      try {
        // Cadastra nova obra no Firestore
        await addDoc(collection(db, "obras"), obraData);
        successMessage.textContent = 'Obra cadastrada com sucesso!';
        obraForm.reset();
        await renderObrasTable();
        // Fecha modal após 2 segundos
        setTimeout(() => {
          modal.style.display = 'none';
          successMessage.textContent = '';
        }, 2000);
      } catch (error) {
        errorMessage.textContent = `Erro ao cadastrar obra: ${error.message}`;
      }
    });
  }

  // Manipula submissão do formulário de edição de obra
  if (editObraForm) {
    editObraForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const errorMessage = document.getElementById('edit-error-message');
      const successMessage = document.getElementById('edit-success-message');
      const modal = document.getElementById('modalEditarObra');
      errorMessage.textContent = '';
      successMessage.textContent = '';

      const obraId = document.getElementById('edit-obra-id').value;
      const obraData = {
        endereco: document.getElementById('edit-endereco').value.trim(),
        status: document.getElementById('edit-status').value,
        dataInicio: document.getElementById('edit-data-inicio').value,
        dataTermino: document.getElementById('edit-data-termino').value || null,
        responsavelTecnico: document.getElementById('edit-responsavel-tecnico').value.trim(),
        alvara: document.getElementById('edit-alvara').value.trim(),
        registroCrea: document.getElementById('edit-registro-crea').value.trim(),
        registroCal: document.getElementById('edit-registro-cal').value.trim(),
        empresaId: document.getElementById('edit-empresa').value
      };

      // Valida campos obrigatórios
      if (!obraData.endereco) {
        errorMessage.textContent = "Por favor, insira o endereço.";
        return;
      }
      if (!obraData.status) {
        errorMessage.textContent = "Por favor, selecione o status.";
        return;
      }
      if (!obraData.dataInicio) {
        errorMessage.textContent = "Por favor, insira a data de início.";
        return;
      }
      if (!obraData.responsavelTecnico) {
        errorMessage.textContent = "Por favor, insira o responsável técnico.";
        return;
      }
      if (!obraData.alvara) {
        errorMessage.textContent = "Por favor, insira o alvará.";
        return;
      }
      if (!obraData.registroCrea) {
        errorMessage.textContent = "Por favor, insira o registro no CREA.";
        return;
      }
      if (!obraData.registroCal) {
        errorMessage.textContent = "Por favor, insira o registro no CAL.";
        return;
      }
      if (!obraData.empresaId) {
        errorMessage.textContent = "Por favor, selecione uma construtora.";
        return;
      }

      try {
        // Atualiza obra no Firestore
        const obraRef = doc(db, "obras", obraId);
        await updateDoc(obraRef, obraData);
        successMessage.textContent = 'Obra atualizada com sucesso!';
        editObraForm.reset();
        await renderObrasTable();
        // Fecha modal após 2 segundos
        setTimeout(() => {
          modal.style.display = 'none';
          successMessage.textContent = '';
        }, 2000);
      } catch (error) {
        errorMessage.textContent = `Erro ao atualizar obra: ${error.message}`;
      }
    });
  }

  // Configura links de navegação
  const dashboardLink = document.querySelector('.dashboard-link');
  if (dashboardLink) {
    dashboardLink.addEventListener('click', () => redirecionarParaMenu());
  }

  const empresasLink = document.querySelector('.empresas-link');
  if (empresasLink) {
    empresasLink.addEventListener('click', () => redirecionarParaMenuEmpresa());
  }

  const obrasLink = document.querySelector('.obras-link');
  if (obrasLink) {
    obrasLink.addEventListener('click', () => redirecionarParaObras());
  }

  const configuracoesLink = document.querySelector('.configuracoes-link');
  if (configuracoesLink) {
    configuracoesLink.addEventListener('click', () => redirecionarParaConfiguracoes());
  }

  // Renderiza tabela de obras
  async function renderObrasTable() {
    const lista = document.getElementById('obra-lista');
    if (!lista) {
      console.error("Elemento obra-lista não encontrado!");
      return;
    }
    lista.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

    try {
      const obrasSnapshot = await getDocs(collection(db, "obras"));
      const empresasSnapshot = await getDocs(collection(db, "empresas"));

      if (obrasSnapshot.empty) {
        lista.innerHTML = '<tr><td colspan="3">Nenhuma obra encontrada.</td></tr>';
        return;
      }

      lista.innerHTML = '';
      for (const docSnapshot of obrasSnapshot.docs) {
        const obraData = docSnapshot.data();
        const obraId = docSnapshot.id;

        // Busca nome da empresa associada
        const empresaDoc = empresasSnapshot.docs.find(doc => doc.id === obraData.empresaId);
        const empresaNome = empresaDoc ? empresaDoc.data().razaoSocial : "Empresa não encontrada";

        // Escapa aspas simples para evitar erros em atributos
        const escapedEndereco = (obraData.endereco || "Endereço não disponível").replace(/'/g, "\\'");

        const tr = document.createElement('tr');
        tr.setAttribute('data-id', obraId);
        tr.innerHTML = `
          <td>${obraData.endereco || "Endereço não disponível"}</td>
          <td>${empresaNome}</td>
          <td>
            <button title="Editar" onclick="editObra('${obraId}')"><i class="ri-edit-line"></i></button>
            <button title="Expandir" class="expand-btn" data-id="${obraId}"><i class="ri-arrow-down-s-line"></i></button>
            <button title="Deletar" onclick="deleteObra('${obraId}', '${escapedEndereco}')"><i class="ri-delete-bin-line"></i></button>
          </td>
        `;
        lista.appendChild(tr);

        // Adiciona evento para expandir detalhes
        const expandBtn = tr.querySelector('.expand-btn');
        expandBtn.addEventListener('click', () => toggleExpandRow(obraId, obraData, expandBtn));
      }

      // Adiciona estilos dinâmicos para linhas expandidas
      const style = document.createElement('style');
      style.textContent = `
        .expanded-details {
          background: #f9f9f9;
          padding: 15px;
          border-top: 1px solid #ddd;
        }
        .expanded-details p {
          margin: 5px 0;
        }
        .expanded-row td {
          padding: 0 !important;
        }
      `;
      document.head.appendChild(style);
    } catch (error) {
      console.error("Erro ao carregar obras:", error);
      lista.innerHTML = `<tr><td colspan="3">Erro ao carregar obras: ${error.message}</td></tr>`;
    }
  }

  // Alterna exibição de detalhes expandidos de uma obra
  function toggleExpandRow(obraId, obraData, expandBtn) {
    const row = document.querySelector(`tr[data-id="${obraId}"]`);
    const existingExpandedRow = row.nextElementSibling;

    // Fecha outras linhas expandidas
    document.querySelectorAll('.expanded-row').forEach((expandedRow) => {
      if (expandedRow !== existingExpandedRow) {
        expandedRow.remove();
        const otherBtn = document.querySelector(`.expand-btn[data-id="${expandedRow.dataset.id}"] i`);
        if (otherBtn) otherBtn.className = 'ri-arrow-down-s-line';
      }
    });

    // Alterna entre abrir e fechar a linha expandida
    if (existingExpandedRow && existingExpandedRow.classList.contains('expanded-row')) {
      existingExpandedRow.remove();
      expandBtn.querySelector('i').className = 'ri-arrow-down-s-line';
    } else {
      const expandedRow = document.createElement('tr');
      expandedRow.classList.add('expanded-row');
      expandedRow.dataset.id = obraId;
      expandedRow.innerHTML = `
        <td colspan="3">
          <div class="expanded-details">
            <p><strong>Status:</strong> ${obraData.status || 'N/A'}</p>
            <p><strong>Data de Início:</strong> ${obraData.dataInicio || 'N/A'}</p>
            <p><strong>Data de Término:</strong> ${obraData.dataTermino || 'N/A'}</p>
            <p><strong>Responsável Técnico:</strong> ${obraData.responsavelTecnico || 'N/A'}</p>
            <p><strong>Alvará:</strong> ${obraData.alvara || 'N/A'}</p>
            <p><strong>Registro CREA:</strong> ${obraData.registroCrea || 'N/A'}</p>
            <p><strong>Registro CAL:</strong> ${obraData.registroCal || 'N/A'}</p>
          </div>
        </td>
      `;
      row.insertAdjacentElement('afterend', expandedRow);
      expandBtn.querySelector('i').className = 'ri-arrow-up-s-line';
    }
  }

  // Prepara formulário de edição com dados da obra
  window.editObra = async function(obraId) {
    try {
      const obraRef = doc(db, "obras", obraId);
      const obraDoc = await getDoc(obraRef);
      if (obraDoc.exists()) {
        const obraData = obraDoc.data();
        const modal = document.getElementById('modalEditarObra');
        // Preenche campos do formulário de edição
        document.getElementById('edit-obra-id').value = obraId;
        document.getElementById('edit-endereco').value = obraData.endereco || '';
        document.getElementById('edit-status').value = obraData.status || '';
        document.getElementById('edit-data-inicio').value = obraData.dataInicio || '';
        document.getElementById('edit-data-termino').value = obraData.dataTermino || '';
        document.getElementById('edit-responsavel-tecnico').value = obraData.responsavelTecnico || '';
        document.getElementById('edit-alvara').value = obraData.alvara || '';
        document.getElementById('edit-registro-crea').value = obraData.registroCrea || '';
        document.getElementById('edit-registro-cal').value = obraData.registroCal || '';
        document.getElementById('edit-empresa').value = obraData.empresaId || '';
        await carregarEmpresas('edit-empresa');
        modal.style.display = 'flex';
      } else {
        alert("Erro: Obra não encontrada para edição.");
      }
    } catch (error) {
      console.error("Erro ao buscar dados da obra para edição:", error);
      alert(`Erro ao preparar edição: ${error.message}`);
    }
  };

  // Exclui obra após confirmação
  window.deleteObra = async function(obraId, endereco) {
    const confirmDelete = confirm(`Tem certeza que deseja remover a obra "${endereco}"?`);
    if (confirmDelete) {
      try {
        await deleteDoc(doc(db, "obras", obraId));
        await renderObrasTable();
      } catch (error) {
        console.error("Erro ao remover obra:", error);
        alert(`Erro ao remover obra: ${error.message}`);
      }
    }
  };

  // Monitora estado de autenticação
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Atualiza informações do usuário na interface
      const userNameElement = document.querySelector(".user-profile .name");
      const userEmailElement = document.querySelector(".user-profile .email");
      if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
      if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
      await renderObrasTable();
    } else {
      // Redireciona para login se não autenticado
      window.location.href = "login.html";
    }
  });
});