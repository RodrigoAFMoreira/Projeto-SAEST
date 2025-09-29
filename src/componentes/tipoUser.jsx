// Em uso em dashboard, sidebar, configuração
// Componente simples para exibir o tipo de usuário

const TipoUser = ({ userType, className }) => {
  const roleDisplayNames = {
    user: 'Funcionário',
    gestor: 'Gestor de Segurança',
    administrador: 'Administrador',
  };

  return (
    <span className={className || ''}>
      {roleDisplayNames[userType] || 'Desconhecido'}
    </span>
  );
};

export default TipoUser;