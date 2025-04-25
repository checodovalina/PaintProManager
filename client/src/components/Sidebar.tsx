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
} from "lucide-react";
import { cn } from "@/lib/utils";

interface SidebarProps {
  open: boolean;
  toggleSidebar: () => void;
}

export default function Sidebar({ open, toggleSidebar }: SidebarProps) {
  const [location] = useLocation();

  // Navigation items
  const navItems = [
    { icon: TrendingUp, name: "Dashboard", path: "/" },
    { icon: Users, name: "Clients & Prospects", path: "/clients" },
    { icon: FileText, name: "Quotes", path: "/quotes" },
    { icon: Clipboard, name: "Service Orders", path: "/orders" },
    { icon: GitBranch, name: "Projects", path: "/projects" },
    { icon: HardHat, name: "Personnel", path: "/personnel" },
    { icon: File, name: "Invoicing", path: "/invoicing" },
    { icon: BarChart3, name: "Reports", path: "/reports" },
  ];

  if (!open) return null;

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 bg-slate-900 text-white">
        {/* Logo */}
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-700">
          <div className="flex items-center">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6 text-orange-500 mr-2"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <line x1="3" y1="21" x2="21" y2="21"></line>
              <path d="M18 21V8H9a3 3 0 0 0-3 3v10"></path>
              <circle cx="9" cy="11" r="1"></circle>
            </svg>
            <span className="text-xl font-semibold">Dovalina Painting LLC</span>
          </div>
          <button
            onClick={toggleSidebar}
            className="md:hidden text-gray-400 hover:text-white"
          >
            <ChevronLeft />
          </button>
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-2 py-4 space-y-1">
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
              {item.name}
            </Link>
          ))}
        </nav>

        {/* User Menu */}
        <div className="p-4 border-t border-gray-700">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="h-8 w-8 rounded-full bg-gray-500 flex items-center justify-center text-white">
                JD
              </div>
            </div>
            <div className="ml-3">
              <p className="text-sm font-medium text-white">John Dovalina</p>
              <p className="text-xs text-gray-400">Administrator</p>
            </div>
            <button className="ml-auto text-gray-400 hover:text-white">
              <Settings className="h-5 w-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
