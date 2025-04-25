import { ReactNode, useState, useEffect } from "react";
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
  
  // Cerrar automáticamente el menú cuando cambie la ruta en dispositivos móviles
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location, isMobile]);

  // If we're on the auth page, only show the main content
  if (location === "/auth") {
    return <>{children}</>;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar - only show if user is authenticated */}
      {user && <Sidebar open={sidebarOpen} toggleSidebar={toggleSidebar} />}

      {/* Main Content */}
      <div className="flex flex-col flex-1 overflow-hidden">
        {/* Top Navigation - only show if user is authenticated */}
        {user && <Header toggleSidebar={toggleSidebar} />}

        {/* Main Content Area */}
        <main className={`flex-1 overflow-y-auto ${user ? 'p-6 bg-gray-50' : ''}`}>
          {children}
        </main>
      </div>
    </div>
  );
}
