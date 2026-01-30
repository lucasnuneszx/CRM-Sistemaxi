"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";

import { CasaParceira } from "@/types/casaParceira";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  ArrowLeft, 
  Plus, 
  Edit, 
  Trash2, 
  ExternalLink,
  Building2,
  Link as LinkIcon 
} from "lucide-react";
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';



export default function CasasParceirasPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const router = useRouter();
  const [casas, setCasas] = useState<CasaParceira[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);


  useEffect(() => {
    fetchCasas();
  }, []);

  const fetchCasas = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.PARTNER_HOUSES)}/projeto/${resolvedParams.id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      
      if (response.ok) {
        const data = await response.json();
        setCasas(data);
      } else {
        throw new Error("Falha ao carregar casas parceiras");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (casa: CasaParceira) => {
    router.push(`/projects/${resolvedParams.id}/casas-parceiras/${casa.slug}/edit`);
  };

  const handleCreate = () => {
    router.push(`/projects/${resolvedParams.id}/casas-parceiras/new`);
  };

  const handleDelete = async (casa: CasaParceira) => {
    if (!confirm(`Tem certeza que deseja excluir ${casa.nome}?`)) return;

    try {
      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.PARTNER_HOUSES)}/${casa.id}`,
        {
          method: "DELETE",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.ok) {
        fetchCasas();
      } else {
        throw new Error("Erro ao excluir casa parceira");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    }
  };





  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <Button onClick={handleCreate}>
          <Plus className="mr-2 h-4 w-4" /> Nova Casa Parceira
        </Button>
      </div>

      <div className="flex items-center gap-2 mb-6">
        <Building2 className="h-6 w-6" />
        <h1 className="text-3xl font-bold">Casas Parceiras</h1>
      </div>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}



      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {casas.map((casa) => (
          <Card key={casa.id}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <div className="flex items-center gap-2">
                {casa.logo_url ? (
                  <img 
                    src={casa.logo_url} 
                    alt={casa.nome}
                    className="w-8 h-8 object-contain rounded"
                  />
                ) : (
                  <Building2 className="h-8 w-8 text-muted-foreground" />
                )}
                <div>
                  <CardTitle className="text-lg">{casa.nome}</CardTitle>
                  <Badge variant={casa.ativo ? "default" : "secondary"}>
                    {casa.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </div>
              </div>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => router.push(`/projects/${resolvedParams.id}/casas-parceiras/${casa.slug}/gerador`)}
                >
                  <LinkIcon className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleEdit(casa)}>
                  <Edit className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => handleDelete(casa)}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <p><strong>Slug:</strong> {casa.slug}</p>
                {casa.codigo_afiliado && (
                  <p><strong>Código:</strong> {casa.codigo_afiliado}</p>
                )}
                <div className="flex items-center gap-2">
                  <strong>Link Base:</strong>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => window.open(casa.link_base, '_blank')}
                  >
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {casas.length === 0 && !loading && (
        <Card>
          <CardContent className="py-8 text-center">
            <Building2 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold mb-2">Nenhuma casa parceira encontrada</h3>
            <p className="text-muted-foreground mb-4">
              Adicione casas de apostas para começar a gerar links com UTM parameters
            </p>
            <Button onClick={handleCreate}>
              <Plus className="mr-2 h-4 w-4" /> Adicionar Casa Parceira
            </Button>
          </CardContent>
        </Card>
      )}


    </div>
  );
} 