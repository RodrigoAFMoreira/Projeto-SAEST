
import { NavLink } from 'react-router-dom';
import { Info, FileText, Settings, Home, Building, Building2, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';
import '../css/menuEsquerdo.css';
import TipoUser from './TipoUser';

const Sidebar = ({ userType, userEmail, isMinimized, onToggle }) => {
  const items = userType === 'user'
    ? [
        { text: 'Informações sobre Trabalho com Segurança', path: '/informacoes', icon: <Info /> },
        { text: 'Certificações', path: '/certificacoes', icon: <FileText /> },
        { text: 'Configurações', path: '/configuracoes', icon: <Settings /> },
      ]
    : [
        { text: 'Dashboard', path: '/menu', icon: <Home /> },
        { text: 'Construtoras', path: '/construtoras', icon: <Building /> },
        { text: 'Obras', path: '/obras', icon: <Building2 /> },
        { text: 'EPIs', path: '/epis', icon: <ShieldCheck /> },
        { text: 'Configurações', path: '/configuracoes', icon: <Settings /> },
      ];

  return (
    <aside className={`sidebar role-${userType} ${isMinimized ? 'minimized' : ''}`}>
      <div>
        <div className="sidebar-header">
          <div className="logo">SAEST</div>
          <button className="toggle-button" onClick={onToggle}>
            {isMinimized ? <ChevronRight /> : <ChevronLeft />}
          </button>
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
                  {!isMinimized && <span>{item.text}</span>}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="user-profile">
        <div className="user-info">
          {!isMinimized && (
            <div className={`name role-${userType}`}>
              <TipoUser userType={userType} />
            </div>
          )}
          {!isMinimized && <div className="email" id="user-email">{userEmail || 'carregando...'}</div>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;