import { useState } from "react";
import { Menu, Bell, Search, LogOut, User } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [language, setLanguage] = useState<"en" | "es">("es");
  const { user, logoutMutation } = useAuth();
  const { toast } = useToast();

  const handleLogout = () => {
    logoutMutation.mutate(undefined, {
      onSuccess: () => {
        toast({
          title: "Sesión cerrada",
          description: "Has cerrado sesión correctamente",
        });
      },
    });
  };

  return (
    <header className="bg-white shadow-sm">
      <div className="flex items-center justify-between h-16 px-4 border-b border-gray-200">
        <button
          onClick={toggleSidebar}
          className="md:hidden text-gray-500 hover:text-gray-700"
        >
          <Menu className="h-6 w-6" />
        </button>

        <div className="flex-1 flex justify-center px-2 md:justify-end md:ml-6">
          <div className="max-w-lg w-full lg:max-w-xs relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Buscar clientes, proyectos..."
              className="pl-10"
            />
          </div>
        </div>

        <div className="ml-4 flex items-center md:ml-6">
          {/* Language Toggle */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="h-8 px-3 text-gray-500 hover:text-gray-700 mr-3"
              >
                <span className="font-medium text-sm">
                  {language === "en" ? (
                    <>
                      <span className="font-medium">EN</span> |{" "}
                      <span className="text-gray-400">ES</span>
                    </>
                  ) : (
                    <>
                      <span className="text-gray-400">EN</span> |{" "}
                      <span className="font-medium">ES</span>
                    </>
                  )}
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setLanguage("en")}>
                English
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setLanguage("es")}>
                Español
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Notifications */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 relative mr-2"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>Nueva solicitud de cotización</DropdownMenuItem>
              <DropdownMenuItem>Alerta de retraso en proyecto</DropdownMenuItem>
              <DropdownMenuItem>Recordatorio de reunión</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* User Menu */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 flex items-center space-x-1"
              >
                <div className="h-8 w-8 rounded-full bg-blue-600 flex items-center justify-center text-white">
                  {user?.fullName?.substring(0, 2) || 'US'}
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <div className="px-4 py-2">
                <p className="text-sm font-medium">{user?.fullName}</p>
                <p className="text-xs text-gray-500">{user?.email}</p>
                <p className="text-xs mt-1 text-blue-600 font-semibold">
                  {user?.role === 'superadmin' ? 'Super Administrador' : 
                   user?.role === 'admin' ? 'Administrador' : 'Usuario'}
                </p>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem className="flex items-center">
                <User className="h-4 w-4 mr-2" />
                Mi perfil
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="flex items-center text-red-600">
                <LogOut className="h-4 w-4 mr-2" />
                Cerrar sesión
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
