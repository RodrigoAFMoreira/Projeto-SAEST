// Em uso em todos menos em login, cadastro, esqueci-senha, verificar-email
// Componente Sidebar para navegação lateral (ESTÁTICO)

import { NavLink } from 'react-router-dom';
import { Info, FileText, Settings, Home, Building, Building2, ShieldCheck, Search } from 'lucide-react';
import '../css/menuEsquerdo.css';
import TipoUser from './TipoUser';

const Sidebar = ({ userType, userEmail }) => {
  let items;

  if (userType === 'user') {
    items = [
      { text: 'Informações sobre Trabalho com Segurança', path: '/informacoes', icon: <Info /> },
      { text: 'Certificações', path: '/certificacoes', icon: <FileText /> },
      { text: 'Configurações', path: '/configuracoes', icon: <Settings /> },
    ];
  } else if (userType === 'gestor') {
    items = [
      { text: 'Dashboard', path: '/menu', icon: <Home /> },
      { text: 'Busca de Obras', path: '/busca-obras', icon: <Search /> }, 
      { text: 'EPIs', path: '/epis', icon: <ShieldCheck /> },
      { text: 'Configurações', path: '/configuracoes', icon: <Settings /> },
    ];
  } else {
    items = [
      { text: 'Dashboard', path: '/menu', icon: <Home /> },
      { text: 'Construtoras', path: '/construtoras', icon: <Building /> },
      { text: 'Obras', path: '/obras', icon: <Building2 /> },
      { text: 'EPIs', path: '/epis', icon: <ShieldCheck /> },
      { text: 'Configurações', path: '/configuracoes', icon: <Settings /> },
    ];
  }

  return (
    <aside className={`sidebar role-${userType}`}>
      <div>
        <div className="sidebar-header">
          <div className="logo">SAEST</div>
        </div>
        <nav className="sidebar-nav">
          <ul>
            {items.map((item) => (
              <li key={item.path}>
                <NavLink
                  to={item.path}
                  className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
                >
                  {item.icon}
                  <span>{item.text}</span>
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="user-profile">
        <div className="user-info">
          <div className={`name role-${userType}`}>
            <TipoUser userType={userType} />
          </div>
          <div className="email" id="user-email">{userEmail || 'carregando...'}</div>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;