import {
  ChevronUp,
  User2,
  Users,
  Building2,
  Loader2,
  LayoutDashboard,
  FolderOpen,
  Activity,
  Settings,
  LogOut,
  Sparkles,
  Palette,
  FileText,
  TrendingDown,
  TrendingUp,
  Bell,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarSeparator,
  useSidebar,
} from "./ui/sidebar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "./ui/dropdown-menu";
import { useAuth } from "@/context/AuthContext";
import { useState, useEffect } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useTheme } from "next-themes";
import Image from "next/image";

// Itens principais de gestão
const mainItems = [
  {
    title: "Dashboard",
    url: "/dashboard",
    icon: LayoutDashboard,
    color: "text-blue-600",
    roles: ["admin", "project_manager", "creative_user"] // Todos podem ver dashboard
  },
  {
    title: "Projetos",
    url: "/projects",
    icon: FolderOpen,
    color: "text-green-600",
    roles: ["admin", "project_manager"] // Apenas admins e gerentes de projeto
  },
  {
    title: "Atividades",
    url: "/atividades",
    icon: Activity,
    color: "text-purple-600",
    roles: ["admin", "project_manager"] // Apenas admins e gerentes de projeto
  },
];

// Itens de recursos
const resourceItems = [
  {
    title: "Funil de Vendas",
    url: "/funil-vendas",
    icon: Activity,
    color: "text-blue-600",
    roles: ["admin", "project_manager", "creative_user"] // Todos podem ver funil de vendas
  },
  {
    title: "Propostas",
    url: "/propostas",
    icon: FileText,
    color: "text-green-600",
    roles: ["admin", "project_manager", "creative_user"] // Todos podem ver propostas
  },
  {
    title: "Criativos",
    url: "/criativos",
    icon: Palette,
    color: "text-pink-600",
    roles: ["admin", "project_manager", "creative_user"] // Todos podem ver criativos
  },
  {
    title: "Arquivos",
    url: "/arquivos",
    icon: FileText,
    color: "text-indigo-600",
    roles: ["admin", "project_manager", "creative_user"] // Todos podem ver arquivos
  },
];

// Itens financeiros
const financeItems = [
  {
    title: "Contas a Pagar",
    url: "/financeiro/contas-a-pagar",
    icon: TrendingDown,
    color: "text-orange-600",
    roles: ["admin", "project_manager"] // Admins e gerentes
  },
  {
    title: "Contas a Receber",
    url: "/financeiro/contas-a-receber",
    icon: TrendingUp,
    color: "text-green-600",
    roles: ["admin", "project_manager"] // Admins e gerentes
  },
];

// Itens de administração
const adminItems = [
  {
    title: "Cobrança",
    url: "/cobranca",
    icon: Bell,
    color: "text-yellow-600",
    roles: ["admin", "project_manager"] // Admins e gestores de projeto
  },
  {
    title: "Clientes",
    url: "/clientes/new",
    icon: User2,
    color: "text-blue-600",
    roles: ["admin", "project_manager"] // Admins e gerentes
  },
  {
    title: "Usuários",
    url: "/users",
    icon: Users,
    color: "text-indigo-600",
    roles: ["admin"] // Apenas admins
  },
  {
    title: "Setores",
    url: "/setores",
    icon: Building2,
    color: "text-cyan-600",
    roles: ["admin"] // Apenas admins
  },
];

const AppSidebar = () => {
  const { logout, user } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [loading, setLoading] = useState<string | null>(null);
  const { setOpenMobile, isMobile } = useSidebar();
  const { theme, resolvedTheme } = useTheme();
  const [userProjects, setUserProjects] = useState([]);
  const [mounted, setMounted] = useState(false);

  // Detectar quando o componente está montado para evitar hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Determinar qual logo usar baseado no tema
  const logoSrc = mounted && (theme === 'light' || resolvedTheme === 'light')
    ? 'https://i.imgur.com/UNByME0.png'
    : 'https://i.imgur.com/9SRt34r.png';
  
  // Resetar loading quando a rota mudar
  useEffect(() => {
    if (loading) {
      setLoading(null);
    }
  }, [pathname]);
  
  // Determinar role do usuário
  const getUserRole = () => {
    if (!user) return "creative_user";
    // Verificar se é admin (pode ser is_admin ou role === "admin")
    const isAdmin = (user as any).is_admin || (user as any).role === "admin";
    if (isAdmin) return "admin";
    // Verificar role do usuário
    const userRole = (user as any).role;
    if (userRole === "project_manager") return "project_manager";
    // Por padrão, assumir creative_user
    return "creative_user";
  };

  const userRole = getUserRole();

  // Filtrar itens baseado na role do usuário
  const filterItemsByRole = (items: any[]) => {
    return items.filter(item => item.roles.includes(userRole));
  };
  
  const handleNavigation = (url: string) => {
    setLoading(url);
    
    // Fechar sidebar no mobile após clicar
    if (isMobile) {
      // Pequeno delay para permitir que o usuário veja o feedback visual antes de fechar
      setTimeout(() => {
        setOpenMobile(false);
      }, 150);
    }
    
    router.push(url);
  };
  
  if (!user) {
    return (
      <Sidebar>
        <SidebarContent>
          <div className="flex items-center justify-center h-full">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </SidebarContent>
      </Sidebar>
    );
  }

  const filteredMainItems = filterItemsByRole(mainItems);
  const filteredResourceItems = filterItemsByRole(resourceItems);
  const filteredFinanceItems = filterItemsByRole(financeItems);
  const filteredAdminItems = filterItemsByRole(adminItems);

  return (
    <Sidebar collapsible="icon" className="border-r-2">
      <SidebarHeader className="pt-10 pb-4 px-2">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton 
              onClick={() => handleNavigation('/dashboard')}
              className="cursor-pointer hover:bg-primary/10 transition-all duration-200 w-full p-3 overflow-visible"
            >
              <div className="flex flex-col items-center justify-center w-full gap-2 overflow-visible">
                {/* Logo */}
                <div className="relative w-full flex items-center justify-center overflow-visible min-h-[120px]">
                  {mounted && (
                    <Image
                      src={logoSrc}
                      alt="Sistemaxi Logo"
                      width={280}
                      height={140}
                      className="object-contain w-full h-auto"
                      style={{ maxWidth: '100%', height: 'auto' }}
                      priority
                    />
                  )}
                </div>
                {/* Texto centralizado */}
                <span className="text-xs text-muted-foreground text-center font-medium"></span>
              </div>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarHeader>
      
      <SidebarSeparator className="mx-4" />
      
      <SidebarContent className="px-4">
        {/* Principais */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Principal
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredMainItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.url)}
                    className={`cursor-pointer h-11 rounded-lg transition-all duration-200 hover:bg-muted/80 hover:shadow-sm ${
                      pathname === item.url 
                        ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-sm' 
                        : 'hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {loading === item.url ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <item.icon className={`h-5 w-5 ${pathname === item.url ? 'text-primary' : item.color}`} />
                      )}
                      <span className={`font-medium ${pathname === item.url ? 'text-primary' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-6" />

        {/* Recursos */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Recursos
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredResourceItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.url)}
                    className={`cursor-pointer h-11 rounded-lg transition-all duration-200 hover:bg-muted/80 hover:shadow-sm ${
                      pathname === item.url 
                        ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-sm' 
                        : 'hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {loading === item.url ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <item.icon className={`h-5 w-5 ${pathname === item.url ? 'text-primary' : item.color}`} />
                      )}
                      <span className={`font-medium ${pathname === item.url ? 'text-primary' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        <SidebarSeparator className="my-6" />

        {/* Financeiro */}
        {filteredFinanceItems.length > 0 && (
          <>
            <SidebarGroup>
              <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
                Financeiro
              </SidebarGroupLabel>
              <SidebarGroupContent>
                <SidebarMenu className="space-y-1">
                  {filteredFinanceItems.map((item) => (
                    <SidebarMenuItem key={item.title}>
                      <SidebarMenuButton 
                        onClick={() => handleNavigation(item.url)}
                        className={`cursor-pointer h-11 rounded-lg transition-all duration-200 hover:bg-muted/80 hover:shadow-sm ${
                          pathname === item.url 
                            ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-sm' 
                            : 'hover:translate-x-0.5'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          {loading === item.url ? (
                            <Loader2 className="h-5 w-5 animate-spin text-primary" />
                          ) : (
                            <item.icon className={`h-5 w-5 ${pathname === item.url ? 'text-primary' : item.color}`} />
                          )}
                          <span className={`font-medium ${pathname === item.url ? 'text-primary' : ''}`}>
                            {item.title}
                          </span>
                        </div>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  ))}
                </SidebarMenu>
              </SidebarGroupContent>
            </SidebarGroup>

            <SidebarSeparator className="my-6" />
          </>
        )}

        {/* Administração */}
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2">
            Administração
          </SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu className="space-y-1">
              {filteredAdminItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton 
                    onClick={() => handleNavigation(item.url)}
                    className={`cursor-pointer h-11 rounded-lg transition-all duration-200 hover:bg-muted/80 hover:shadow-sm ${
                      pathname === item.url 
                        ? 'bg-primary/10 text-primary border-l-4 border-primary shadow-sm' 
                        : 'hover:translate-x-0.5'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      {loading === item.url ? (
                        <Loader2 className="h-5 w-5 animate-spin text-primary" />
                      ) : (
                        <item.icon className={`h-5 w-5 ${pathname === item.url ? 'text-primary' : item.color}`} />
                      )}
                      <span className={`font-medium ${pathname === item.url ? 'text-primary' : ''}`}>
                        {item.title}
                      </span>
                    </div>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
      
      <SidebarFooter className="p-4">
        <SidebarMenu>
          <SidebarMenuItem>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <SidebarMenuButton className="h-12 hover:bg-muted/80 transition-all duration-200 rounded-lg">
                  <div className="flex items-center gap-3 w-full">
                    <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary/80 rounded-lg flex items-center justify-center">
                      <User2 className="h-4 w-4 text-white" />
                    </div>
                    <div className="flex flex-col items-start flex-1">
                      <span className="font-medium text-sm">{user?.name || 'Usuário'}</span>
                      <span className="text-xs text-muted-foreground">{user?.email || 'email@exemplo.com'}</span>
                    </div>
                    <ChevronUp className="h-4 w-4 text-muted-foreground" />
                  </div>
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem 
                  onClick={() => router.push('/perfil')}
                  className="cursor-pointer flex items-center gap-2 p-3"
                >
                  <User2 className="h-4 w-4" />
                  Perfil
                </DropdownMenuItem>
                <DropdownMenuItem className="cursor-pointer flex items-center gap-2 p-3">
                  <Settings className="h-4 w-4" />
                  Configurações
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem 
                  onClick={logout}
                  className="cursor-pointer flex items-center gap-2 p-3 text-red-600 focus:text-red-600"
                >
                  <LogOut className="h-4 w-4" />
                  Sair
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
