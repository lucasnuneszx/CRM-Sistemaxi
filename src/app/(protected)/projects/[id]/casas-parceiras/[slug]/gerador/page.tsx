"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";

import { 
  ArrowLeft, 
  Copy,
  ExternalLink,
  Building2
} from "lucide-react";
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface CasaParceira {
  id: string;
  nome: string;
  slug: string;
  logo_url?: string;
  link_base: string;
  codigo_afiliado?: string;
  utm_source?: string;
  utm_medium?: string;
  utm_campaign?: string;
  ativo: boolean;
  projeto_id: string;
}

export default function GeradorLinksPage({ params }: { params: Promise<{ id: string; slug: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const router = useRouter();
  const [casa, setCasa] = useState<CasaParceira | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [linkFinal, setLinkFinal] = useState("");
  const [utmParams, setUtmParams] = useState<Record<string, string>>({});

  // Estados para seleção de canal
  const [canalSelecionado, setCanalSelecionado] = useState<string>("");
  const [subcanalSelecionado, setSubcanalSelecionado] = useState<string>("");
  
  // Estados para override (avançado)
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [overrideUtmContent, setOverrideUtmContent] = useState("");
  const [overrideUtmTerm, setOverrideUtmTerm] = useState("");

  const canais = {
    geral: {
      label: "Geral",
      color: "bg-gray-600",
      subcanais: [{ value: "", label: "Sem Canal" }]
    },
    instagram: {
      label: "Instagram", 
      color: "bg-gradient-to-r from-purple-500 to-pink-500",
      subcanais: [
        { value: "close_friends", label: "Instagram Close Friends" },
        { value: "normal", label: "Instagram Normal" }
      ]
    },
    telegram: {
      label: "Telegram",
      color: "bg-blue-500", 
      subcanais: [
        { value: "free", label: "Telegram Free" },
        { value: "vip", label: "Telegram VIP" }
      ]
    }
  };

  useEffect(() => {
    fetchCasa();
  }, []);

  useEffect(() => {
    // Resetar subcanal quando trocar canal
    setSubcanalSelecionado("");
  }, [canalSelecionado]);

  const fetchCasa = async () => {
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
        const casas = await response.json();
        const casaEncontrada = casas.find((c: CasaParceira) => c.slug === resolvedParams.slug);
        
        if (casaEncontrada) {
          setCasa(casaEncontrada);
        } else {
          setError("Casa parceira não encontrada");
        }
      } else {
        throw new Error("Falha ao carregar casa parceira");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const gerarLink = async () => {
    if (!casa || !canalSelecionado) return;

    setLoading(true);
    setError(null);

    try {
      const linkRequest = {
        canal: canalSelecionado,
        subcanal: subcanalSelecionado || undefined,
        override_utm_content: overrideUtmContent || undefined,
        override_utm_term: overrideUtmTerm || undefined,
      };

      const response = await fetch(
        `${buildApiUrl(API_CONFIG.ENDPOINTS.PARTNER_HOUSES)}/${casa.id}/generate-link`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(linkRequest),
        }
      );

      if (response.ok) {
        const data = await response.json();
        setLinkFinal(data.link_final);
        setUtmParams(data.utm_params);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || "Erro ao gerar link");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro desconhecido");
    } finally {
      setLoading(false);
    }
  };

  const copiarLink = async () => {
    if (linkFinal) {
      await navigator.clipboard.writeText(linkFinal);
      alert("Link copiado para a área de transferência!");
    }
  };

  const selecionarCanal = (canal: string) => {
    setCanalSelecionado(canal);
    // Se o canal só tem uma opção de subcanal (como geral), seleciona automaticamente
    const canalConfig = canais[canal as keyof typeof canais];
    if (canalConfig.subcanais.length === 1) {
      setSubcanalSelecionado(canalConfig.subcanais[0].value);
    }
  };

  if (!casa) {
    return (
      <div className="container mx-auto py-8">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        {loading ? (
          <p className="text-center mt-8">Carregando...</p>
        ) : (
          <Alert variant="destructive" className="mt-8">
            <AlertDescription>{error || "Casa parceira não encontrada"}</AlertDescription>
          </Alert>
        )}
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-black text-white">
      <div className="container mx-auto py-8">
        <Button 
          variant="ghost" 
          onClick={() => router.back()}
          className="mb-6 text-white hover:text-gray-300"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>

        <div className="text-center mb-8">
          {casa.logo_url ? (
            <img 
              src={casa.logo_url} 
              alt={casa.nome}
              className="max-w-[200px] h-auto object-contain mx-auto mb-4 rounded-lg"
            />
          ) : (
            <div className="w-20 h-20 bg-red-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <Building2 className="h-10 w-10 text-white" />
            </div>
          )}
          <h1 className="text-4xl font-bold text-red-500 mb-2">Gerador {casa.nome.toUpperCase()}</h1>
        </div>

        <div className="max-w-2xl mx-auto space-y-6">
          {/* Link de Afiliado */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Link de Afiliado</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                <div className="flex-1 bg-gray-700 rounded px-3 py-2 text-gray-300 text-sm">
                  {casa.link_base}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(casa.link_base, '_blank')}
                  className="text-gray-400 hover:text-white"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Código do bilhete */}
          {casa.codigo_afiliado && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white">Código do bilhete ou link da aposta pronta</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-700 rounded px-4 py-3 text-white font-mono text-lg text-center">
                  {casa.codigo_afiliado}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Seleção de Canal */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Selecione o Canal</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4 mb-4">
                {Object.entries(canais).map(([key, canal]) => (
                  <Button
                    key={key}
                    variant={canalSelecionado === key ? "default" : "outline"}
                    className={`h-12 ${canalSelecionado === key ? canal.color : 'border-gray-600 text-gray-300 hover:text-white'}`}
                    onClick={() => selecionarCanal(key)}
                  >
                    {canal.label}
                  </Button>
                ))}
              </div>

              {/* Subcanais */}
              {canalSelecionado && canais[canalSelecionado as keyof typeof canais].subcanais.length > 1 && (
                <div className="grid grid-cols-2 gap-4">
                  {canais[canalSelecionado as keyof typeof canais].subcanais.map((subcanal) => (
                    <Button
                      key={subcanal.value}
                      variant={subcanalSelecionado === subcanal.value ? "default" : "outline"}
                      className={`h-12 ${
                        subcanalSelecionado === subcanal.value 
                          ? canalSelecionado === 'telegram' ? 'bg-blue-600' : 'bg-red-600'
                          : 'border-gray-600 text-gray-300 hover:text-white'
                      }`}
                      onClick={() => setSubcanalSelecionado(subcanal.value)}
                    >
                      {subcanal.label}
                    </Button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Override Avançado (Opcional) */}
          <Card className="bg-gray-800 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white flex items-center justify-between">
                Override Avançado
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="text-gray-400 hover:text-white"
                >
                  {showAdvanced ? 'Ocultar' : 'Mostrar'}
                </Button>
              </CardTitle>
            </CardHeader>
            {showAdvanced && (
              <CardContent className="space-y-4">
                <div>
                  <Label className="text-gray-300">Override UTM Content</Label>
                  <Input
                    value={overrideUtmContent}
                    onChange={(e) => setOverrideUtmContent(e.target.value)}
                    placeholder="Substituir UTM Content configurado"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
                <div>
                  <Label className="text-gray-300">Override UTM Term</Label>
                  <Input
                    value={overrideUtmTerm}
                    onChange={(e) => setOverrideUtmTerm(e.target.value)}
                    placeholder="Substituir UTM Term configurado"
                    className="bg-gray-700 border-gray-600 text-white"
                  />
                </div>
              </CardContent>
            )}
          </Card>

          {/* Botão Gerar Link */}
          <div className="text-center">
            <Button
              onClick={gerarLink}
              disabled={!canalSelecionado || loading}
              className="bg-red-600 hover:bg-red-700 text-white px-8 py-3 text-lg font-semibold"
            >
              {loading ? "Gerando..." : "Gerar Link"}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Link Final */}
          {linkFinal && (
            <Card className="bg-gray-800 border-gray-700">
              <CardHeader>
                <CardTitle className="text-white flex items-center justify-between">
                  Link Final
                  <Button
                    onClick={copiarLink}
                    variant="outline"
                    size="sm"
                    className="border-red-600 text-red-400 hover:bg-red-600 hover:text-white"
                  >
                    <Copy className="h-4 w-4 mr-2" />
                    Copiar
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="bg-gray-700 rounded p-4 mb-4">
                  <p className="text-green-400 break-all">{linkFinal}</p>
                </div>
                
                {/* Mostrar UTM Parameters */}
                <div className="space-y-2">
                  <h4 className="font-semibold text-white">Parâmetros UTM:</h4>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    {Object.entries(utmParams).map(([key, value]) => (
                      <div key={key} className="text-gray-300">
                        <strong>{key}:</strong> {value}
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
} 