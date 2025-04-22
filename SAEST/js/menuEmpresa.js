import {
    redirecionarParaCadastroEmpresa,
    redirecionarParaCadastroObra,
    redirecionarParaMenu
} from './redirecionar.js';

document.addEventListener('DOMContentLoaded', () => {
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

    const dashboardLink = document.querySelector('.dashboard-link');
    if (dashboardLink) {
        console.log("Dashboard link found:", dashboardLink);
        dashboardLink.addEventListener('click', () => {
            console.log("Dashboard link clicked, redirecting to menu.html");
            redirecionarParaMenu();
        });
    } else {
        console.error("Dashboard link not found!");
    }

    const btnCadastrarEmpresa = document.querySelector('.btn.primary');
    const btnNovaObra = document.querySelector('.btn.secondary');

    if (btnCadastrarEmpresa) {
        btnCadastrarEmpresa.addEventListener('click', redirecionarParaCadastroEmpresa);
    }

    if (btnNovaObra) {
        btnNovaObra.addEventListener('click', redirecionarParaCadastroObra);
    }

    const empresas = [
        { nome: 'Construtora Alpha', obras: 4, risco: 'Alto' },
        { nome: 'Beta Engenharia', obras: 2, risco: 'Médio' },
        { nome: 'Construtora Gama', obras: 6, risco: 'Baixo' }
    ];

    const lista = document.getElementById('empresa-lista');

    if (empresas.length === 0) {
        lista.innerHTML = '';
        return;
    }

    empresas.forEach(empresa => {
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${empresa.nome}</td>
            <td>${empresa.obras}</td>
            <td>
                <span class="badge ${empresa.risco === 'Alto' ? 'red' : empresa.risco === 'Médio' ? 'yellow' : 'green'}">
                    ${empresa.risco}
                </span>
            </td>
            <td>
                <button title="Editar"><i class="ri-edit-line"></i></button>
                <button title="Expandir"><i class="ri-arrow-down-s-line"></i></button>
                <button title="Deletar"><i class="ri-delete-bin-line"></i></button>
            </td>
        `;
        lista.appendChild(tr);
    });
});
