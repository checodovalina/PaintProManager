import { ReactNode, useState } from "react";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import { useMobile } from "@/hooks/use-mobile";
import { useAuth } from "@/hooks/use-auth";
import { useLocation } from "wouter";

interface LayoutProps {
  children: ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const isMobile = useMobile();
  const [sidebarOpen, setSidebarOpen] = useState(!isMobile);
  const { user } = useAuth();
  const [location] = useLocation();

  const toggleSidebar = () => {
    setSidebarOpen(!sidebarOpen);
  };

  // Si estamos en la página de autenticación, solo mostramos el contenido principal
  if (location === "/auth") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - solo mostrar si el usuario está autenticado */}
      {user && <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation - solo mostrar si el usuario está autenticado */}
        {user && <Header toggleSidebar={toggleSidebar} />}

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto ${user ? 'p-6 bg-gray-50' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
