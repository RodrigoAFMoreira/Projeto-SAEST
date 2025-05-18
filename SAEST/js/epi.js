document.addEventListener('DOMContentLoaded', () => {
    async function renderEpiTable() {
        const lista = document.getElementById('epi-lista');
        if (!lista) {
            console.error("Elemento epi-lista não encontrado!");
            return;
        }
        lista.innerHTML = `
            <tr>
                <td colspan="3">
                    <div class="loading-spinner"></div>
                </td>
            </tr>
        `;
        try {
            await new Promise(resolve => setTimeout(resolve, 2000));
            lista.innerHTML = '<tr><td colspan="3">Dados carregados (placeholder).</td></tr>';
        } catch (error) {
            console.error("Erro ao carregar EPIs:", error);
            lista.innerHTML = `<tr><td colspan="3">Erro ao carregar EPIs: ${error.message}</td></tr>`;
        }
    }

    function abrirModalEpi() {
        const modal = document.getElementById('modalEpi');
        if (modal) {
            modal.style.display = 'flex';
        }
    }

    function fecharModalEpi() {
        const modal = document.getElementById('modalEpi');
        const form = document.getElementById('epi-form');
        const errorMessage = document.getElementById('error-message');
        const successMessage = document.getElementById('success-message');
        if (modal) {
            modal.style.display = 'none';
        }
        if (form) {
            form.reset();
        }
        if (errorMessage) {
            errorMessage.textContent = '';
        }
        if (successMessage) {
            successMessage.textContent = '';
        }
    }

    const botaoAbrirModal = document.querySelector('.btn.primary');
    if (botaoAbrirModal) {
        botaoAbrirModal.addEventListener('click', abrirModalEpi);
    }

    const botaoCancelar = document.querySelector('#modalEpi .btn.secondary');
    if (botaoCancelar) {
        botaoCancelar.addEventListener('click', fecharModalEpi);
    }

    const botaoFechar = document.querySelector('#modalEpi .modal-close');
    if (botaoFechar) {
        botaoFechar.addEventListener('click', fecharModalEpi);
    }

    renderEpiTable();
});