// menuObra tem interface para cadastro, edição e exclusão de obras,
// Ele renderiza uma tabela de obras com detalhes expansíveis,
// carrega empresas para associação, valida formulários de criação e edição exibidos em modals, e suporta navegação responsiva
// Logs rastreiam erros e interações
import { auth, db } from "./firebase-config.js";
import {
  collection,
  getDocs,
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  query,
  where,
} from "https://www.gstatic.com/firebasejs/11.5.0/firebase-firestore.js";
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.5.0/firebase-auth.js";

console.log("menuObra.js carregado");

// Carrega empresas para preencher <select> elements
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
    const errorMessage = selectElementId === "empresa" ? "error-message" : "edit-error-message";
    document.getElementById(errorMessage).textContent = "Erro ao carregar empresas.";
  }
};

// Registra uma nova obra
const registrarObra = async (obraData) => {
  try {
    console.log("Tentando registrar obra:", obraData);
    await addDoc(collection(db, "obras"), {
      ...obraData,
      criadoEm: new Date(),
    });
    console.log("Obra registrada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao registrar obra:", error);
    throw error;
  }
};

// Atualiza uma obra existente
const atualizarObra = async (obraId, obraData) => {
  try {
    const obraRef = doc(db, "obras", obraId);
    await updateDoc(obraRef, obraData);
    console.log("Obra atualizada com sucesso!");
    return true;
  } catch (error) {
    console.error("Erro ao atualizar obra:", error);
    throw error;
  }
};

// Renderiza a tabela de obras
async function renderObrasTable(filter = "", status = "") {
  const lista = document.getElementById("obra-lista");
  if (!lista) {
    console.error("Elemento obra-lista não encontrado!");
    return;
  }
  lista.innerHTML = '<tr><td colspan="3"><div class="loading-spinner"></div></td></tr>';

  try {
    let queryRef = collection(db, "obras");
    if (filter) {
      queryRef = query(queryRef, where("endereco", ">=", filter), where("endereco", "<=", filter + "\uf8ff"));
    }
    if (status) {
      queryRef = query(queryRef, where("status", "==", status));
    }

    const obrasSnapshot = await getDocs(queryRef);
    const empresasSnapshot = await getDocs(collection(db, "empresas"));

    if (obrasSnapshot.empty) {
      lista.innerHTML = '<tr><td colspan="3">Nenhuma obra encontrada.</td></tr>';
      return;
    }

    lista.innerHTML = "";
    for (const docSnapshot of obrasSnapshot.docs) {
      const obraData = docSnapshot.data();
      const obraId = docSnapshot.id;

      const empresaDoc = empresasSnapshot.docs.find((doc) => doc.id === obraData.empresaId);
      const empresaNome = empresaDoc ? empresaDoc.data().razaoSocial : "Empresa não encontrada";

      const escapedEndereco = (obraData.endereco || "Endereço não disponível").replace(/'/g, "\\'");

      const tr = document.createElement("tr");
      tr.setAttribute("data-id", obraId);
      tr.innerHTML = `
        <td>${obraData.endereco || "Endereço não disponível"}</td>
        <td>${empresaNome}</td>
        <td>
          <button title="Editar" onclick="editObra('${obraId}')"><i class="ri-edit-line"></i></button>
          <button title="Expandir" class="expand-btn" data-id="${obraId}"><i class="ri-arrow-down-s-line"></i></button>
          <button title="Deletar" onclick="openDeleteModal('${obraId}', '${escapedEndereco}')"><i class="ri-delete-bin-line"></i></button>
        </td>
      `;
      lista.appendChild(tr);

      const expandBtn = tr.querySelector(".expand-btn");
      expandBtn.addEventListener("click", () => toggleExpandRow(obraId, obraData, expandBtn));
    }

    const style = document.createElement("style");
    style.textContent = `
      .expanded-details { background: #f9f9f9; padding: 15px; border-top: 1px solid #ddd; }
      .expanded-details p { margin: 5px 0; }
      .expanded-row td { padding: 0 !important; }
    `;
    document.head.appendChild(style);
  } catch (error) {
    console.error("Erro ao carregar obras:", error);
    lista.innerHTML = `<tr><td colspan="3">Erro ao carregar obras: ${error.message}</td></tr>`;
  }
}

// Alterna exibição de detalhes expandidos
function toggleExpandRow(obraId, obraData, expandBtn) {
  const row = document.querySelector(`tr[data-id="${obraId}"]`);
  const existingExpandedRow = row.nextElementSibling;

  document.querySelectorAll(".expanded-row").forEach((expandedRow) => {
    if (expandedRow !== existingExpandedRow) {
      expandedRow.remove();
      const otherBtn = document.querySelector(`.expand-btn[data-id="${expandedRow.dataset.id}"] i`);
      if (otherBtn) otherBtn.className = "ri-arrow-down-s-line";
    }
  });

  if (existingExpandedRow && existingExpandedRow.classList.contains("expanded-row")) {
    existingExpandedRow.remove();
    expandBtn.querySelector("i").className = "ri-arrow-down-s-line";
  } else {
    const expandedRow = document.createElement("tr");
    expandedRow.classList.add("expanded-row");
    expandedRow.dataset.id = obraId;
    expandedRow.innerHTML = `
      <td colspan="3">
        <div class="expanded-details">
          <p><strong>Status:</strong> ${obraData.status || "N/A"}</p>
          <p><strong>Data de Início:</strong> ${obraData.dataInicio || "N/A"}</p>
          <p><strong>Data de Término:</strong> ${obraData.dataTermino || "N/A"}</p>
          <p><strong>Responsável Técnico:</strong> ${obraData.responsavelTecnico || "N/A"}</p>
          <p><strong>Alvará:</strong> ${obraData.alvara || "N/A"}</p>
          <p><strong>Registro CREA:</strong> ${obraData.registroCrea || "N/A"}</p>
          <p><strong>Registro CAL:</strong> ${obraData.registroCal || "N/A"}</p>
        </div>
      </td>
    `;
    row.insertAdjacentElement("afterend", expandedRow);
    expandBtn.querySelector("i").className = "ri-arrow-up-s-line";
  }
}

// Abre o modal de exclusão
window.openDeleteModal = function (obraId, endereco) {
  const modal = document.getElementById("modalDeletarObra");
  const obraNome = document.getElementById("delete-obra-nome");
  obraNome.textContent = endereco;
  modal.style.display = "flex";

  const confirmBtn = document.getElementById("confirm-delete-btn");
  const cancelBtn = document.getElementById("cancel-delete-btn");

  confirmBtn.onclick = async () => {
    try {
      await deleteDoc(doc(db, "obras", obraId));
      modal.style.display = "none";
      await renderObrasTable();
    } catch (error) {
      console.error("Erro ao remover obra:", error);
      alert(`Erro ao remover obra: ${error.message}`);
    }
  };

  cancelBtn.onclick = () => {
    modal.style.display = "none";
  };
};

// Fecha o modal de exclusão
window.closeDeleteModal = function () {
  document.getElementById("modalDeletarObra").style.display = "none";
};

// Edita uma obra
window.editObra = async function (obraId) {
  try {
    const obraRef = doc(db, "obras", obraId);
    const obraDoc = await getDoc(obraRef);
    if (obraDoc.exists()) {
      const obraData = obraDoc.data();
      const modal = document.getElementById("modalEditarObra");
      document.getElementById("edit-obra-id").value = obraId;
      document.getElementById("edit-endereco").value = obraData.endereco || "";
      document.getElementById("edit-status").value = obraData.status || "";
      document.getElementById("edit-data-inicio").value = obraData.dataInicio || "";
      document.getElementById("edit-data-termino").value = obraData.dataTermino || "";
      document.getElementById("edit-responsavel-tecnico").value = obraData.responsavelTecnico || "";
      document.getElementById("edit-alvara").value = obraData.alvara || "";
      document.getElementById("edit-registro-crea").value = obraData.registroCrea || "";
      document.getElementById("edit-registro-cal").value = obraData.registroCal || "";
      await carregarEmpresas("edit-empresa");
      document.getElementById("edit-empresa").value = obraData.empresaId || "";
      modal.style.display = "flex";
    } else {
      alert("Erro: Obra não encontrada para edição.");
    }
  } catch (error) {
    console.error("Erro ao buscar dados da obra para edição:", error);
    alert(`Erro ao preparar edição: ${error.message}`);
  }
};

// Configuração inicial
document.addEventListener("DOMContentLoaded", () => {
  // Carrega empresas para formulários
  carregarEmpresas("empresa");

  // Configura formulário de cadastro
  const obraForm = document.getElementById("obra-form");
  if (obraForm) {
    obraForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorMessage = document.getElementById("error-message");
      const successMessage = document.getElementById("success-message");
      errorMessage.textContent = "";
      successMessage.textContent = "";

      const obraData = {
        endereco: document.getElementById("endereco").value.trim(),
        status: document.getElementById("status").value,
        dataInicio: document.getElementById("data-inicio").value,
        dataTermino: document.getElementById("data-termino").value || null,
        responsavelTecnico: document.getElementById("responsavel-tecnico").value.trim(),
        alvara: document.getElementById("alvara").value.trim(),
        registroCrea: document.getElementById("registro-crea").value.trim(),
        registroCal: document.getElementById("registro-cal").value.trim(),
        empresaId: document.getElementById("empresa").value,
      };

      // Validação
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
      // Validação do intervalo de anos para data de início
      const inicio = new Date(obraData.dataInicio);
      const anoInicio = inicio.getFullYear();
      if (anoInicio < 1950 || anoInicio > 2050) {
        errorMessage.textContent = "A data de início deve estar entre 1950 e 2050.";
        return;
      }
      // Validação de data de término
      if (obraData.dataTermino) {
        const termino = new Date(obraData.dataTermino);
        const anoTermino = termino.getFullYear();
        if (anoTermino < 1950 || anoTermino > 2050) {
          errorMessage.textContent = "A data de término deve estar entre 1950 e 2050.";
          return;
        }
        if (termino < inicio) {
          errorMessage.textContent = "A data de término não pode ser anterior à data de início.";
          return;
        }
      }

      try {
        await registrarObra(obraData);
        successMessage.textContent = "Obra cadastrada com sucesso!";
        obraForm.reset();
        await renderObrasTable();
        setTimeout(() => {
          document.getElementById("modalObra").style.display = "none";
          successMessage.textContent = "";
        }, 2000);
      } catch (error) {
        errorMessage.textContent = `Erro ao cadastrar obra: ${error.message}`;
      }
    });
  }

  // Configura formulário de edição
  const editObraForm = document.getElementById("edit-obra-form");
  if (editObraForm) {
    editObraForm.addEventListener("submit", async (e) => {
      e.preventDefault();
      const errorMessage = document.getElementById("edit-error-message");
      const successMessage = document.getElementById("edit-success-message");
      errorMessage.textContent = "";
      successMessage.textContent = "";

      const obraId = document.getElementById("edit-obra-id").value;
      const obraData = {
        endereco: document.getElementById("edit-endereco").value.trim(),
        status: document.getElementById("edit-status").value,
        dataInicio: document.getElementById("edit-data-inicio").value,
        dataTermino: document.getElementById("edit-data-termino").value || null,
        responsavelTecnico: document.getElementById("edit-responsavel-tecnico").value.trim(),
        alvara: document.getElementById("edit-alvara").value.trim(),
        registroCrea: document.getElementById("edit-registro-crea").value.trim(),
        registroCal: document.getElementById("edit-registro-cal").value.trim(),
        empresaId: document.getElementById("edit-empresa").value,
      };

      // Validação
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
        await atualizarObra(obraId, obraData);
        successMessage.textContent = "Obra atualizada com sucesso!";
        editObraForm.reset();
        await renderObrasTable();
        setTimeout(() => {
          document.getElementById("modalEditarObra").style.display = "none";
          successMessage.textContent = "";
        }, 2000);
      } catch (error) {
        errorMessage.textContent = `Erro ao atualizar obra: ${error.message}`;
      }
    });
  }

  // Configura busca e filtro
  const searchInput = document.getElementById("search-input");
  const statusFilter = document.getElementById("status-filter");
  if (searchInput && statusFilter) {
    const applyFilter = () => {
      const filter = searchInput.value.trim();
      const status = statusFilter.value;
      renderObrasTable(filter, status);
    };
    searchInput.addEventListener("input", applyFilter);
    statusFilter.addEventListener("change", applyFilter);
  }

  // Monitora autenticação
  onAuthStateChanged(auth, async (user) => {
    if (user) {
      const userNameElement = document.querySelector(".user-profile .name");
      const userEmailElement = document.querySelector(".user-profile .email");
      if (userNameElement) userNameElement.textContent = user.displayName || "Usuário";
      if (userEmailElement) userEmailElement.textContent = user.email || "email@não.disponível";
      await renderObrasTable();
    } else {
      window.location.href = "login.html";
    }
  });
});