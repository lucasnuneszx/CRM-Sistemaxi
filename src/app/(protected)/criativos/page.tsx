"use client";

import { useState, useEffect } from "react";
import { Plus, BarChart3, Clock, CheckCircle2, XCircle, AlertCircle, Palette, Search, Download, MoreVertical, Edit, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import { buildApiUrl } from "@/config/api";
import { useAuth } from "@/context/AuthContext";
import { NovoCriativoModal } from "@/components/criativos/NovoCriativoModal";

// Types
interface Criativo {
  id: string;
  titulo: string;
  descricao?: string;
  status: "material_cru" | "em_edicao" | "aguardando_revisao" | "aprovado" | "rejeitado";
  tipo_arquivo: "IMAGEM" | "VIDEO" | "AUDIO" | "DOCUMENTO";
  prioridade: "baixa" | "media" | "alta" | "urgente";
  prazo?: string;
  criado_por_id: string;
  editado_por_id?: string;
  projeto_id: string;
  created_at: string;
  updated_at: string;
}

interface KanbanData {
  material_cru: Criativo[];
  em_edicao: Criativo[];
  aguardando_revisao: Criativo[];
  aprovado: Criativo[];
  rejeitado: Criativo[];
}

interface Stats {
  total: number;
  material_cru: number;
  em_edicao: number;
  aguardando_revisao: number;
  aprovado: number;
  rejeitado: number;
}

// Status config
const statusConfig = {
  material_cru: {
    label: "Material Cru",
    color: "bg-gray-50 border-gray-200",
    headerColor: "bg-gray-100",
    icon: Clock,
    iconColor: "text-gray-600"
  },
  em_edicao: {
    label: "Em Edição",
    color: "bg-blue-50 border-blue-200",
    headerColor: "bg-blue-100",
    icon: Palette,
    iconColor: "text-blue-600"
  },
  aguardando_revisao: {
    label: "Aguardando Revisão",
    color: "bg-amber-50 border-amber-200",
    headerColor: "bg-amber-100",
    icon: AlertCircle,
    iconColor: "text-amber-600"
  },
  aprovado: {
    label: "Aprovado",
    color: "bg-green-50 border-green-200",
    headerColor: "bg-green-100",
    icon: CheckCircle2,
    iconColor: "text-green-600"
  },
  rejeitado: {
    label: "Rejeitado",
    color: "bg-red-50 border-red-200",
    headerColor: "bg-red-100",
    icon: XCircle,
    iconColor: "text-red-600"
  }
};

// Priority config
const priorityConfig = {
  baixa: { label: "Baixa", color: "bg-gray-100 text-gray-800" },
  media: { label: "Média", color: "bg-blue-100 text-blue-800" },
  alta: { label: "Alta", color: "bg-orange-100 text-orange-800" },
  urgente: { label: "Urgente", color: "bg-red-100 text-red-800" }
};

// File type config
const fileTypeConfig = {
  IMAGEM: { label: "Imagem", color: "bg-green-100 text-green-800" },
  VIDEO: { label: "Vídeo", color: "bg-purple-100 text-purple-800" },
  AUDIO: { label: "Áudio", color: "bg-yellow-100 text-yellow-800" },
  DOCUMENTO: { label: "Documento", color: "bg-blue-100 text-blue-800" }
};

export default function CriativosPage() {
  const { token, user } = useAuth();
  const [kanbanData, setKanbanData] = useState<KanbanData>({
    material_cru: [],
    em_edicao: [],
    aguardando_revisao: [],
    aprovado: [],
    rejeitado: []
  });
  const [stats, setStats] = useState<Stats>({
    total: 0,
    material_cru: 0,
    em_edicao: 0,
    aguardando_revisao: 0,
    aprovado: 0,
    rejeitado: 0
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState<string>("todos");
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Fetch data
  const fetchData = async () => {
    if (!token) {
      setError("Usuário não autenticado");
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch kanban data and stats in parallel
      const [kanbanResponse, statsResponse] = await Promise.all([
        fetch(buildApiUrl("/v1/criativos/kanban"), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        }),
        fetch(buildApiUrl("/v1/criativos/stats"), {
          headers: {
            "Authorization": `Bearer ${token}`,
            "Content-Type": "application/json"
          }
        })
      ]);

      if (kanbanResponse.ok) {
        const kanbanData = await kanbanResponse.json();
        setKanbanData(kanbanData);
      } else {
        const errorText = await kanbanResponse.text();
        console.error("Erro ao carregar dados Kanban:", errorText);
        setError("Erro ao carregar dados do Kanban");
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      } else {
        const errorText = await statsResponse.text();
        console.error("Erro ao carregar estatísticas:", errorText);
      }
    } catch (error) {
      console.error("Erro ao carregar criativos:", error);
      setError("Erro ao conectar com o servidor");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [token]);

  // Handle modal success
  const handleModalSuccess = () => {
    setIsModalOpen(false);
    fetchData(); // Refresh data
  };

  // Handle download
  const handleDownload = async (criativo: Criativo) => {
    if (!token) return;
    
    try {
      const response = await fetch(buildApiUrl(`/v1/criativos/${criativo.id}/download`), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        // Abrir URL de download em nova aba
        window.open(data.download_url, '_blank');
      } else {
        const errorData = await response.json();
        alert(`Erro ao baixar arquivo: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Erro ao baixar arquivo:", error);
      alert("Erro ao baixar arquivo");
    }
  };

  // Handle status change
  const handleStatusChange = async (criativo: Criativo, newStatus: string) => {
    if (!token) return;
    
    try {
      const response = await fetch(buildApiUrl(`/v1/criativos/${criativo.id}/status`), {
        method: 'PATCH',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(newStatus)
      });

      if (response.ok) {
        // Refresh data to show updated status
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Erro ao alterar status: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Erro ao alterar status:", error);
      alert("Erro ao alterar status");
    }
  };

  // Handle delete
  const handleDelete = async (criativo: Criativo) => {
    if (!token) return;
    
    if (!confirm(`Tem certeza que deseja excluir "${criativo.titulo}"?`)) {
      return;
    }
    
    try {
      const response = await fetch(buildApiUrl(`/v1/criativos/${criativo.id}`), {
        method: 'DELETE',
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        // Refresh data to remove deleted item
        fetchData();
      } else {
        const errorData = await response.json();
        alert(`Erro ao excluir criativo: ${errorData.detail}`);
      }
    } catch (error) {
      console.error("Erro ao excluir criativo:", error);
      alert("Erro ao excluir criativo");
    }
  };

  // Filter criativos
  const filterCriativos = (criativos: Criativo[]) => {
    return criativos.filter(criativo => {
      const matchesSearch = !searchTerm || 
        criativo.titulo.toLowerCase().includes(searchTerm.toLowerCase()) ||
        criativo.descricao?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = filterType === "todos" || criativo.tipo_arquivo === filterType;
      return matchesSearch && matchesType;
    });
  };

  // Render criativo card
  const renderCriativoCard = (criativo: Criativo) => {
    const isOverdue = criativo.prazo && new Date(criativo.prazo) < new Date();
    
    return (
      <Card key={criativo.id} className="mb-3 hover:shadow-md transition-shadow">
        <CardContent className="p-4">
          <div className="flex justify-between items-start mb-2">
            <h4 className="font-medium text-sm line-clamp-2 flex-1">{criativo.titulo}</h4>
            <div className="flex items-center gap-2 ml-2">
              <Badge className={`text-xs ${priorityConfig[criativo.prioridade].color}`}>
                {priorityConfig[criativo.prioridade].label}
              </Badge>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                    <MoreVertical className="h-3 w-3" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => handleDownload(criativo)}>
                    <Download className="h-4 w-4 mr-2" />
                    Baixar arquivo
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => handleStatusChange(criativo, "em_edicao")} disabled={criativo.status === "em_edicao"}>
                    <Edit className="h-4 w-4 mr-2" />
                    Mover para Edição
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleStatusChange(criativo, "aguardando_revisao")} disabled={criativo.status === "aguardando_revisao"}>
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Enviar para Revisão
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleStatusChange(criativo, "aprovado")} disabled={criativo.status === "aprovado"}>
                    <CheckCircle2 className="h-4 w-4 mr-2" />
                    Aprovar
                  </DropdownMenuItem>
                  
                  <DropdownMenuItem onClick={() => handleStatusChange(criativo, "rejeitado")} disabled={criativo.status === "rejeitado"}>
                    <XCircle className="h-4 w-4 mr-2" />
                    Rejeitar
                  </DropdownMenuItem>
                  
                  <DropdownMenuSeparator />
                  
                  <DropdownMenuItem onClick={() => handleDelete(criativo)} className="text-red-600 focus:text-red-600">
                    <Trash2 className="h-4 w-4 mr-2" />
                    Excluir
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
          
          {criativo.descricao && (
            <p className="text-xs text-muted-foreground mb-2 line-clamp-2">
              {criativo.descricao}
            </p>
          )}
          
          <div className="flex items-center justify-between mb-2">
            <Badge className={`text-xs ${fileTypeConfig[criativo.tipo_arquivo].color}`}>
              {fileTypeConfig[criativo.tipo_arquivo].label}
            </Badge>
            
            {criativo.prazo && (
              <span className={`text-xs ${isOverdue ? 'text-red-600' : 'text-muted-foreground'}`}>
                {new Date(criativo.prazo).toLocaleDateString()}
              </span>
            )}
          </div>
          
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Criado em {new Date(criativo.created_at).toLocaleDateString()}</span>
            {isOverdue && (
              <Badge variant="destructive" className="text-xs">
                Atrasado
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  // Render kanban column
  const renderKanbanColumn = (status: keyof KanbanData, criativos: Criativo[]) => {
    const config = statusConfig[status];
    const Icon = config.icon;
    const filteredCriativos = filterCriativos(criativos);

    return (
      <div key={status} className={`flex-1 min-w-[280px] ${config.color} rounded-lg border`}>
        <div className={`${config.headerColor} p-4 rounded-t-lg border-b`}>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Icon className={`h-4 w-4 ${config.iconColor}`} />
              <span className="font-medium text-sm">{config.label}</span>
            </div>
            <Badge variant="secondary" className="text-xs">
              {filteredCriativos.length}
            </Badge>
          </div>
        </div>
        
        <div className="p-4 max-h-[600px] overflow-y-auto">
          {filteredCriativos.map(renderCriativoCard)}
          {filteredCriativos.length === 0 && (
            <div className="text-center text-muted-foreground text-sm py-8">
              {criativos.length === 0 ? "Nenhum criativo neste status" : "Nenhum criativo corresponde aos filtros"}
            </div>
          )}
        </div>
      </div>
    );
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-64 mb-6"></div>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="flex gap-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="flex-1 h-96 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto p-6">
        <div className="text-center py-12">
          <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Erro ao carregar criativos</h2>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={fetchData}>Tentar novamente</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Gestão de Criativos</h1>
          <p className="text-muted-foreground">Gerencie materiais criativos através do workflow</p>
        </div>
        <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Novo Criativo
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-6 gap-4 mb-6">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Total</span>
            </div>
            <p className="text-2xl font-bold mt-1">{stats.total}</p>
          </CardContent>
        </Card>
        
        {Object.entries(statusConfig).map(([status, config]) => {
          const Icon = config.icon;
          const count = stats[status as keyof Stats];
          return (
            <Card key={status}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2">
                  <Icon className={`h-4 w-4 ${config.iconColor}`} />
                  <span className="text-sm font-medium">{config.label}</span>
                </div>
                <p className="text-2xl font-bold mt-1">{count}</p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex gap-4 mb-6">
        <div className="flex-1 max-w-md relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Buscar criativos..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-48">
            <SelectValue placeholder="Filtrar por tipo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="todos">Todos os tipos</SelectItem>
            <SelectItem value="IMAGEM">Imagem</SelectItem>
            <SelectItem value="VIDEO">Vídeo</SelectItem>
            <SelectItem value="AUDIO">Áudio</SelectItem>
            <SelectItem value="DOCUMENTO">Documento</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Kanban Board */}
      <div className="flex gap-4 overflow-x-auto pb-4">
        {Object.entries(kanbanData).map(([status, criativos]) =>
          renderKanbanColumn(status as keyof KanbanData, criativos)
        )}
      </div>

      {/* Empty state */}
      {stats.total === 0 && !loading && (
        <div className="text-center py-12">
          <Palette className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">Nenhum criativo encontrado</h2>
          <p className="text-muted-foreground mb-4">
            Comece criando seu primeiro material criativo
          </p>
          <Button className="gap-2" onClick={() => setIsModalOpen(true)}>
            <Plus className="h-4 w-4" />
            Criar primeiro criativo
          </Button>
        </div>
      )}

      {/* Modal */}
      <NovoCriativoModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleModalSuccess}
      />
    </div>
  );
}
