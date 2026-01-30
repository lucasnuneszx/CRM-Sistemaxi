"use client";

import { LogOut, Moon, Settings, Sun, User, Bell } from "lucide-react";
import Link from "next/link";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useTheme } from "next-themes";
import { SidebarTrigger } from "./ui/sidebar";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import NotificationCenterBackend from "./notifications/NotificationCenterBackend";

const Navbar = () => {
  const { setTheme } = useTheme();
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleProfileClick = () => {
    router.push('/perfil');
  };

  const handleSettingsClick = () => {
    // Navegação para configurações (implementar futuramente)
    console.log("Navegando para configurações...");
  };

  const handleLogout = () => {
    logout();
  };

  // Função para gerar iniciais do usuário
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word.charAt(0))
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  // Construir URL da foto de perfil
  // O backend já retorna a presigned URL completa, então usamos diretamente
  const getPhotoUrl = () => {
    if (!user?.foto_perfil) return undefined;
    // Se já é uma URL completa (http/https), usar diretamente
    if (user.foto_perfil.startsWith('http://') || user.foto_perfil.startsWith('https://')) {
      return user.foto_perfil;
    }
    // Se não começar com http, pode ser um caminho relativo ou object_name do MinIO
    // Nesse caso, retornar undefined para usar o fallback (iniciais)
    return undefined;
  };

  return (
    <nav className="p-4 flex items-center justify-between sticky top-0 bg-background z-10">
      {/* LEFT */}
      <SidebarTrigger />
      
      {/* RIGHT */}
      <div className="flex items-center gap-4">
        <Link href="/dashboard" className="text-sm font-medium hover:text-primary transition-colors">
          Dashboard
        </Link>
        
        {/* NOTIFICATION CENTER */}
        <NotificationCenterBackend />
        
        {/* THEME MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
              <span className="sr-only">Toggle theme</span>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => setTheme("light")}>
              Light
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("dark")}>
              Dark
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setTheme("system")}>
              System
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        {/* USER MENU */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="relative h-10 w-10 rounded-full">
              <Avatar className="h-10 w-10">
                <AvatarImage 
                  src={getPhotoUrl()} 
                  alt={user?.name || 'Usuário'} 
                />
                <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-600 text-white font-semibold">
                  {user?.name ? getUserInitials(user.name) : 'U'}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="w-56" align="end" sideOffset={10}>
            <DropdownMenuLabel className="font-normal">
              <div className="flex flex-col space-y-1">
                <p className="text-sm font-medium leading-none">
                  {user?.name || 'Usuário'}
                </p>
                <p className="text-xs leading-none text-muted-foreground">
                  {user?.email || 'email@exemplo.com'}
                </p>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={handleProfileClick} className="cursor-pointer">
              <User className="h-4 w-4 mr-2" />
              Perfil
            </DropdownMenuItem>
            <DropdownMenuItem onClick={handleSettingsClick} className="cursor-pointer">
              <Settings className="h-4 w-4 mr-2" />
              Configurações
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout} 
              className="cursor-pointer text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-950"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
};

export default Navbar;
