import { useState } from "react";
import { Menu, Bell, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface HeaderProps {
  toggleSidebar: () => void;
}

export default function Header({ toggleSidebar }: HeaderProps) {
  const [language, setLanguage] = useState<"en" | "es">("en");

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
              placeholder="Search clients, projects..."
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
                className="p-1 rounded-full text-gray-500 hover:text-gray-700 relative"
              >
                <Bell className="h-6 w-6" />
                <span className="absolute -top-1 -right-1 inline-flex items-center justify-center w-4 h-4 text-xs font-bold text-white bg-red-500 rounded-full">
                  3
                </span>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem>New quote request</DropdownMenuItem>
              <DropdownMenuItem>Project delay alert</DropdownMenuItem>
              <DropdownMenuItem>Team meeting reminder</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
}
