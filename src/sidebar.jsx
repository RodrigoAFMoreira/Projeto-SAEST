import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Info, FileText, Settings, Home, Building, Building2, File, ShieldCheck, ChevronLeft, ChevronRight } from 'lucide-react';

const Sidebar = ({ userType, userEmail, isMinimized, onToggle }) => {
  const navigate = useNavigate();

  const items = userType === 'user'
    ? [
        { text: 'Informações sobre Trabalho com Segurança', path: '/informacoes', icon: <Info /> },
        { text: 'Certificações', path: '/certificacoes', icon: <FileText /> },
        { text: 'Configurações', path: '#', icon: <Settings /> },
      ]
    : [
        { text: 'Dashboard', path: '/menu', icon: <Home /> },
        { text: 'Construtoras', path: '/menuConstrutora', icon: <Building /> },
        { text: 'Obras', path: '/menuObra', icon: <Building2 /> },
        { text: 'Documentos', path: '/menuDocumentosObra', icon: <File /> },
        { text: 'EPIs', path: '/epi', icon: <ShieldCheck /> },
        { text: 'Configurações', path: '/configuracaoUser', icon: <Settings /> },
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
            {items.map((item, index) => (
              <li key={item.text} className={index === 0 ? 'active' : ''}>
                <a href={item.path} onClick={(e) => { e.preventDefault(); navigate(item.path); }}>
                  {item.icon}
                  {!isMinimized && <span>{item.text}</span>}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      </div>
      <div className="user-profile">
        <div className="user-info">
          <div className={`name role-${userType}`}>{!isMinimized && userType}</div>
          {!isMinimized && <div className="email" id="user-email">{userEmail || 'carregando...'}</div>}
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;