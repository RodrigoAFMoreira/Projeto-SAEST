// src/layout.jsx
import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import Sidebar from "./Sidebar";
import supabase from "./config/supabaseClient";
import "./css/dashboard.css";
import "./css/menuEsquerdo.css";
import "./css/menu.css";

const Layout = () => {
  const [isSidebarMinimized, setIsSidebarMinimized] = React.useState(false);
  const [user, setUser] = React.useState(null);
  const [userData, setUserData] = React.useState({ tipo: "user" });
  const navigate = useNavigate();

  React.useEffect(() => {
    const fetchUser = async () => {
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error || !user) {
        console.log("Usuário não está logado, redirecionando para login");
        navigate("/login");
        return;
      }
      console.log("Usuário logado:", user.id, user.email);
      setUser(user);

      const { data, error: userError } = await supabase
        .from("usuarios")
        .select("*")
        .eq("id", user.id)
        .single();
      if (userError || !data) {
        console.warn("Documento do usuário não encontrado, usando padrão user");
        setUserData({ tipo: "user" });
      } else {
        setUserData(data);
      }
    };
    fetchUser();
  }, [navigate]);

  const handleToggleSidebar = () => {
    setIsSidebarMinimized(!isSidebarMinimized);
  };

  return (
    <div className="container">
      {user && (
        <>
          <Sidebar
            userType={userData.tipo}
            userEmail={user.email}
            isMinimized={isSidebarMinimized}
            onToggle={handleToggleSidebar}
          />
          <main className={`main-content ${isSidebarMinimized ? "shifted-left" : ""}`}>
            <Outlet /> {/* conteudo dinamico */}
          </main>
        </>
      )}
    </div>
  );
};

export default Layout;