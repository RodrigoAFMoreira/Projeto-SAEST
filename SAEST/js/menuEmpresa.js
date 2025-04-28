import { auth, db } from "./firebase-config.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";
import { collection, getDocs, deleteDoc, doc, getDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import {
  redirecionarParaCadastroEmpresa,
  redirecionarParaCadastroObra,
  redirecionarParaMenu,
  redirecionarParaMenuEmpresa,
  redirecionarParaObras
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
  // Sidebar toggle
  const menuToggle = document.getElementById('menu-toggle');
  const sidebar = document.getElementById('sidebar');

  if (menuToggle && sidebar) {
    menuToggle.addEventListener('click', () => {
      sidebar.classList.toggle('active');
    });

    const sidebarItems = sidebar.querySelectorAll('li:not(.dashboard-link)');
    sidebarItems.forEach(item => {
      item.addEventListener('click', () => {
        if (window.innerWidth <= 768) {
          sidebar.classList.remove('active');
        }
      });
    });
  }

  // Navegação
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
    configuracoesLink.addEventListener('click', () => console.log("Configurações link clicado"));
  }

  // Botão Ir para Obras
  const btnGoToObras = document.getElementById('ParaObras');
  if (btnGoToObras) {
    btnGoToObras.addEventListener('click', () => redirecionarParaObras());
  }

  async function renderEmpresasTable() {
    const lista = document.getElementById('empresa-lista');
    if (!lista) {
      console.error("Elemento empresa-lista não encontrado!");
      return;
    }
    lista.innerHTML = '<tr><td colspan="3">Carregando...</td></tr>';

    try {
      const empresasSnapshot = await getDocs(collection(db, "empresas"));
      const obrasSnapshot = await getDocs(collection(db, "obras"));

      if (empresasSnapshot.empty) {
        lista.innerHTML = '<tr><td colspan="3">Nenhuma empresa encontrada.</td></tr>';
        return;
      }

      lista.innerHTML = ''; // Limpa para recriar
      empresasSnapshot.forEach((docSnapshot) => {
        const empresaData = docSnapshot.data();
        const empresaId = docSnapshot.id;

        const obrasRelacionadas = obrasSnapshot.docs.filter(
          (obraDoc) => obraDoc.data().empresaId === empresaId
        );

        const tr = document.createElement('tr');
        tr.setAttribute('data-id', empresaId);
        tr.innerHTML = `
          <td>${empresaData.razaoSocial || "Nome não disponível"}</td>
          <td>${
            obrasRelacionadas.length > 0
              ? obrasRelacionadas.map(obraDoc => {
                  const obraData = obraDoc.data();
                  return `${obraData.endereco} (Status: ${obraData.status || "ativo"})`;
                }).join(", ")
              : "Nenhuma obra relacionada"
          }</td>
          <td class="acoes">
            <button class="icon-button" title="Editar" onclick="editEmpresa('${empresaId}')"><i class="ri-edit-line"></i></button>
            <button class="icon-button expand-btn" data-id="${empresaId}"><i class="ri-arrow-down-s-line"></i></button>
            <button class="icon-button" title="Deletar" onclick="deleteEmpresa('${empresaId}')"><i class="ri-delete-bin-line"></i></button>
          </td>
        `;
        lista.appendChild(tr);

        const expandBtn = tr.querySelector('.expand-btn');
        expandBtn.addEventListener('click', () => toggleExpandRow(empresaId, empresaData, expandBtn));
      });
    } catch (error) {
      console.error("Erro ao carregar empresas:", error);
      lista.innerHTML = `<tr><td colspan="3">Erro ao carregar empresas: ${error.message}</td></tr>`;
    }
  }

  function toggleExpandRow(empresaId, empresaData, expandBtn) {
    const row = document.querySelector(`tr[data-id="${empresaId}"]`);
    const existingExpandedRow = row.nextElementSibling;

    document.querySelectorAll('.expanded-row').forEach((expandedRow) => {
      if (expandedRow !== existingExpandedRow) {
        expandedRow.remove();
        const otherBtn = document.querySelector(`.expand-btn[data-id="${expandedRow.dataset.id}"] i`);
        if (otherBtn) otherBtn.className = 'ri-arrow-down-s-line';
      }
    });

    if (existingExpandedRow && existingExpandedRow.classList.contains('expanded-row')) {
      existingExpandedRow.remove();
      expandBtn.querySelector('i').className = 'ri-arrow-down-s-line';
    } else {
      const expandedRow = document.createElement('tr');
      expandedRow.classList.add('expanded-row');
      expandedRow.dataset.id = empresaId;
      expandedRow.innerHTML = `
        <td colspan="3">
          <div class="expanded-details">
            <p><strong>Nome Fantasia:</strong> ${empresaData.nomeFantasia || 'N/A'}</p>
            <p><strong>E-mail:</strong> ${empresaData.email || 'N/A'}</p>
            <p><strong>Porte da Empresa:</strong> ${empresaData.porte || 'N/A'}</p>
            <p><strong>Telefone:</strong> ${empresaData.telefone || 'N/A'}</p>
          </div>
        </td>
      `;
      row.insertAdjacentElement('afterend', expandedRow);
      expandBtn.querySelector('i').className = 'ri-arrow-up-s-line';
    }
  }

  window.editEmpresa = async function (empresaId) {
    try {
      const empresaRef = doc(db, "empresas", empresaId);
      const empresaDoc = await getDoc(empresaRef);
      if (empresaDoc.exists()) {
        const empresaData = empresaDoc.data();

        // Preencher modal
        document.getElementById('edit-razao-social').value = empresaData.razaoSocial || '';
        document.getElementById('edit-nome-fantasia').value = empresaData.nomeFantasia || '';
        document.getElementById('edit-email').value = empresaData.email || '';
        document.getElementById('edit-porte').value = empresaData.porte || '';
        document.getElementById('edit-telefone').value = empresaData.telefone || '';

        document.getElementById('editar-empresa-form').setAttribute('data-empresa-id', empresaId);

        // Abrir modal editar
        document.getElementById('modalEditarEmpresa').style.display = 'flex';
      } else {
        alert("Empresa não encontrada!");
      }
    } catch (error) {
      console.error("Erro ao buscar empresa:", error);
      alert("Erro ao buscar empresa para edição.");
    }
  };

  window.deleteEmpresa = async function (empresaId) {
    if (confirm("Tem certeza que deseja deletar essa empresa?")) {
      try {
        await deleteDoc(doc(db, "empresas", empresaId));
        alert("Empresa deletada com sucesso.");
        renderEmpresasTable();
      } catch (error) {
        console.error("Erro ao deletar empresa:", error);
        alert("Erro ao deletar empresa.");
      }
    }
  };

  // Salvar edições do modal
  document.getElementById('editar-empresa-form').addEventListener('submit', async function (e) {
    e.preventDefault();
    const empresaId = this.getAttribute('data-empresa-id');

    try {
      const empresaRef = doc(db, "empresas", empresaId);
      await updateDoc(empresaRef, {
        razaoSocial: document.getElementById('edit-razao-social').value,
        nomeFantasia: document.getElementById('edit-nome-fantasia').value,
        email: document.getElementById('edit-email').value,
        porte: document.getElementById('edit-porte').value,
        telefone: document.getElementById('edit-telefone').value
      });

      alert('Empresa atualizada com sucesso!');
      document.getElementById('modalEditarEmpresa').style.display = 'none';
      renderEmpresasTable();
    } catch (error) {
      console.error("Erro ao atualizar empresa:", error);
      alert('Erro ao atualizar empresa.');
    }
  });

  // Verifica login e carrega tabela
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userNameElement = document.querySelector(".user-profile .name");
      const userEmailElement = document.querySelector(".user-profile .email");
      if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
      if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
      await renderEmpresasTable();
    } else {
      window.location.href = "login.html";
    }
  });
});
