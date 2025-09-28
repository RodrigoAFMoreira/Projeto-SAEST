
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