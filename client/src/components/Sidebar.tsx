import { Link, useLocation } from "wouter";
import {
  TrendingUp,
  Users,
  FileText,
  Clipboard,
  GitBranch,
  HardHat,
  File,
  BarChart3,
  ChevronLeft,
  Settings,
  UserCog,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { useMobile } from "@/hooks/use-mobile";

interface SidebarProps {
  open: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ open, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();
  const { user, logoutMutation } = useAuth();
  const isMobile = useMobile();

  // Check if user is admin or superadmin
  const isAdmin = user?.role === "admin" || user?.role === "superadmin";

  // Navigation items
  const navItems = [
    { icon: TrendingUp, name: "Dashboard", path: "/" },
    { icon: Users, name: "Clients & Prospects", shortName: "Clients", path: "/clients" },
    { icon: FileText, name: "Cotizaciones", shortName: "Quotes", path: "/quotes" },
    { icon: Clipboard, name: "Service Orders", shortName: "Orders", path: "/orders" },
    { icon: GitBranch, name: "Projects", shortName: "Projects", path: "/projects" },
    { icon: HardHat, name: "Personnel", shortName: "Personnel", path: "/personnel" },
    { icon: File, name: "Invoicing", shortName: "Invoicing", path: "/invoicing" },
    { icon: BarChart3, name: "Reports", shortName: "Reports", path: "/reports" },
  ];

  // Admin menu items
  const adminItems = [
    { icon: UserCog, name: "User Management", shortName: "Users", path: "/users" },
    { icon: Settings, name: "System Settings", shortName: "Settings", path: "/settings" },
  ];

  // Handle logout
  const handleLogout = () => {
    logoutMutation.mutate();
  };

  // For mobile, if sidebar is closed, we don't show it at all
  if (isMobile && !open) return null;

  return (
    <div 
      className={`
        ${isMobile ? 'fixed inset-y-0 left-0 z-50' : 'flex-shrink-0'} 
        ${open ? 'block' : 'hidden'}
        md:block shadow-lg
      `}
      style={{ 
        width: isMobile ? '75%' : '300px',
        maxWidth: isMobile ? '280px' : '300px'
      }}
    >
      <div className="flex flex-col w-full h-full bg-slate-900 text-white">
        {/* Logo & Header */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center">
            <img 
              src="/images/dovalina-logo.svg" 
              alt="Dovalina Painting" 
              className="h-8 w-8 mr-2" 
            />
            <span className="text-xl font-semibold">Dovalina Painting</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <ChevronLeft />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
          {navItems.map((item) => (
            <Link 
              key={item.path} 
              href={item.path}
              className={cn(
                "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                location === item.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-300 hover:bg-gray-700"
              )}
            >
              <item.icon className="mr-3 h-5 w-5" />
              {isMobile && item.shortName ? item.shortName : item.name}
            </Link>
          ))}

          {/* Separator */}
          {isAdmin && (
            <div className="pt-2 mt-2 border-t border-gray-700">
              <p className="px-4 py-2 text-xs font-semibold text-gray-400 uppercase">
                Administration
              </p>
              
              {adminItems.map((item) => (
                <Link 
                  key={item.path} 
                  href={item.path}
                  className={cn(
                    "flex items-center px-4 py-2 text-sm font-medium rounded-md",
                    location === item.path
                      ? "bg-purple-700 text-white"
                      : "text-gray-300 hover:bg-gray-700"
                  )}
                >
                  <item.icon className="mr-3 h-5 w-5" />
                  {isMobile && item.shortName ? item.shortName : item.name}
                </Link>
              ))}
            </div>
          )}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                {user?.username?.slice(0, 2).toUpperCase() || '...'}
              </div>
            </div>
            <div className="ml-3 overflow-hidden">
              <p className="text-sm font-medium text-white truncate">
                {user?.fullName || user?.username || 'User'}
              </p>
              <p className="text-xs text-gray-400 truncate">
                {user?.role === "superadmin" 
                  ? "Super Admin" 
                  : user?.role === "admin" 
                    ? "Administrator" 
                    : user?.role === "member" 
                      ? "Member" 
                      : "Viewer"}
              </p>
            </div>
            <Button 
              variant="ghost" 
              size="icon" 
              className="ml-auto text-gray-400 hover:text-white"
              onClick={handleLogout}
            >
              <LogOut className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
