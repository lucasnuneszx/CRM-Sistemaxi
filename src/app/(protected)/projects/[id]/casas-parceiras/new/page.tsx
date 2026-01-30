"use client";

import { useState, use } from "react";
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
import { ArrowLeft } from "lucide-react";
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface CanalConfig {
  utm_content?: string;
  utm_term?: string;
  utm_medium?: string;
}

interface CanaisConfig {
  geral?: CanalConfig;
  instagram?: {
    close_friends?: CanalConfig;
    normal?: CanalConfig;
  };
  telegram?: {
    free?: CanalConfig;
    vip?: CanalConfig;
  };
}

export default function NewCasaParceiraPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { token } = useAuth();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    slug: '',
    logo_url: '',
    link_base: '',
    codigo_afiliado: '',
    utm_source: '',
    utm_medium: '',
    utm_campaign: '',
    ativo: true
  });

  const [canaisConfig, setCanaisConfig] = useState<CanaisConfig>({
    geral: { utm_content: '', utm_term: '' },
    instagram: {
      close_friends: { utm_content: '', utm_term: '' },
      normal: { utm_content: '', utm_term: '' }
    },
    telegram: {
      free: { utm_content: '', utm_term: '' },
      vip: { utm_content: '', utm_term: '' }
    }
  });

  const [showAdvancedConfig, setShowAdvancedConfig] = useState(false);

  const generateSlug = (nome: string) => {
    return nome.toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9\s-]/g, '')
      .trim()
      .replace(/\s+/g, '-');
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    
    if (name === 'nome') {
      setFormData(prev => ({
        ...prev,
        [name]: value,
        slug: generateSlug(value)
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: type === 'checkbox' ? checked : value
      }));
    }
  };

  const updateCanalConfig = (canal: keyof CanaisConfig, subcanal: string | null, field: keyof CanalConfig, value: string) => {
    setCanaisConfig(prev => {
      const newConfig = { ...prev };
      
      if (subcanal) {
        if (!newConfig[canal]) {
          newConfig[canal] = {} as any;
        }
        if (!(newConfig[canal] as any)[subcanal]) {
          (newConfig[canal] as any)[subcanal] = {};
        }
        (newConfig[canal] as any)[subcanal][field] = value;
      } else {
        if (!newConfig[canal]) {
          newConfig[canal] = {};
        }
        (newConfig[canal] as any)[field] = value;
      }
      
      return newConfig;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const submitData = {
        ...formData,
        canais_config: canaisConfig,
        projeto_id: resolvedParams.id
      };

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.PARTNER_HOUSES), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(submitData),
      });

      if (response.ok) {
        router.push(`/projects/${resolvedParams.id}/casas-parceiras`);
      } else {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Erro ao criar casa parceira');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center mb-6">
        <Button variant="ghost" onClick={() => router.back()}>
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
      </div>

      <div className="max-w-4xl mx-auto">
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Nova Casa Parceira</CardTitle>
          </CardHeader>
          <CardContent>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Configurações básicas */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">Informações Básicas</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="nome">Nome *</Label>
                    <Input
                      id="nome"
                      name="nome"
                      value={formData.nome}
                      onChange={handleInputChange}
                      placeholder="Ex: Bet365"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="slug">Slug *</Label>
                    <Input
                      id="slug"
                      name="slug"
                      value={formData.slug}
                      onChange={handleInputChange}
                      placeholder="Ex: bet365"
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="logo_url">Logo URL</Label>
                    <Input
                      id="logo_url"
                      name="logo_url"
                      type="url"
                      value={formData.logo_url}
                      onChange={handleInputChange}
                      placeholder="https://..."
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="link_base">Link Base *</Label>
                    <Input
                      id="link_base"
                      name="link_base"
                      type="url"
                      value={formData.link_base}
                      onChange={handleInputChange}
                      placeholder="https://go.aff.casa.com/..."
                      required
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="codigo_afiliado">Código Afiliado</Label>
                    <Input
                      id="codigo_afiliado"
                      name="codigo_afiliado"
                      value={formData.codigo_afiliado}
                      onChange={handleInputChange}
                      placeholder="Ex: 240NFXMMFS0"
                    />
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <input
                      type="checkbox"
                      id="ativo"
                      name="ativo"
                      checked={formData.ativo}
                      onChange={handleInputChange}
                      className="rounded"
                    />
                    <Label htmlFor="ativo">Ativo</Label>
                  </div>
                </div>
              </div>

              {/* UTM Parameters Base */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold">UTM Parameters Base</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <Label htmlFor="utm_source">UTM Source</Label>
                    <Input
                      id="utm_source"
                      name="utm_source"
                      value={formData.utm_source}
                      onChange={handleInputChange}
                      placeholder="Ex: mcgames"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="utm_medium">UTM Medium</Label>
                    <Input
                      id="utm_medium"
                      name="utm_medium"
                      value={formData.utm_medium}
                      onChange={handleInputChange}
                      placeholder="Ex: affiliate"
                    />
                  </div>
                  
                  <div>
                    <Label htmlFor="utm_campaign">UTM Campaign</Label>
                    <Input
                      id="utm_campaign"
                      name="utm_campaign"
                      value={formData.utm_campaign}
                      onChange={handleInputChange}
                      placeholder="Ex: promocao_2024"
                    />
                  </div>
                </div>
              </div>

              {/* Configuração de Canais */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Configuração de Canais</h3>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setShowAdvancedConfig(!showAdvancedConfig)}
                  >
                    {showAdvancedConfig ? 'Ocultar' : 'Configurar Canais'}
                  </Button>
                </div>

                {showAdvancedConfig && (
                  <div className="space-y-6">
                    {/* Canal Geral */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Canal Geral</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div>
                            <Label>UTM Content</Label>
                            <Input
                              value={canaisConfig.geral?.utm_content || ''}
                              onChange={(e) => updateCanalConfig('geral', null, 'utm_content', e.target.value)}
                              placeholder="Ex: geral"
                            />
                          </div>
                          <div>
                            <Label>UTM Term</Label>
                            <Input
                              value={canaisConfig.geral?.utm_term || ''}
                              onChange={(e) => updateCanalConfig('geral', null, 'utm_term', e.target.value)}
                              placeholder="Ex: organico"
                            />
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Canal Instagram */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Instagram</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h5 className="font-medium mb-3">Close Friends</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>UTM Content</Label>
                              <Input
                                value={canaisConfig.instagram?.close_friends?.utm_content || ''}
                                onChange={(e) => updateCanalConfig('instagram', 'close_friends', 'utm_content', e.target.value)}
                                placeholder="Ex: ig_cf"
                              />
                            </div>
                            <div>
                              <Label>UTM Term</Label>
                              <Input
                                value={canaisConfig.instagram?.close_friends?.utm_term || ''}
                                onChange={(e) => updateCanalConfig('instagram', 'close_friends', 'utm_term', e.target.value)}
                                placeholder="Ex: vip"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-3">Normal</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>UTM Content</Label>
                              <Input
                                value={canaisConfig.instagram?.normal?.utm_content || ''}
                                onChange={(e) => updateCanalConfig('instagram', 'normal', 'utm_content', e.target.value)}
                                placeholder="Ex: ig_normal"
                              />
                            </div>
                            <div>
                              <Label>UTM Term</Label>
                              <Input
                                value={canaisConfig.instagram?.normal?.utm_term || ''}
                                onChange={(e) => updateCanalConfig('instagram', 'normal', 'utm_term', e.target.value)}
                                placeholder="Ex: publico"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Canal Telegram */}
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Telegram</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div>
                          <h5 className="font-medium mb-3">Free</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>UTM Content</Label>
                              <Input
                                value={canaisConfig.telegram?.free?.utm_content || ''}
                                onChange={(e) => updateCanalConfig('telegram', 'free', 'utm_content', e.target.value)}
                                placeholder="Ex: tg_free"
                              />
                            </div>
                            <div>
                              <Label>UTM Term</Label>
                              <Input
                                value={canaisConfig.telegram?.free?.utm_term || ''}
                                onChange={(e) => updateCanalConfig('telegram', 'free', 'utm_term', e.target.value)}
                                placeholder="Ex: gratuito"
                              />
                            </div>
                          </div>
                        </div>

                        <div>
                          <h5 className="font-medium mb-3">VIP</h5>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>UTM Content</Label>
                              <Input
                                value={canaisConfig.telegram?.vip?.utm_content || ''}
                                onChange={(e) => updateCanalConfig('telegram', 'vip', 'utm_content', e.target.value)}
                                placeholder="Ex: tg_vip"
                              />
                            </div>
                            <div>
                              <Label>UTM Term</Label>
                              <Input
                                value={canaisConfig.telegram?.vip?.utm_term || ''}
                                onChange={(e) => updateCanalConfig('telegram', 'vip', 'utm_term', e.target.value)}
                                placeholder="Ex: premium"
                              />
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                )}
              </div>

              {/* Buttons */}
              <div className="flex justify-end space-x-2 pt-6">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => router.back()}
                >
                  Cancelar
                </Button>
                <Button type="submit" disabled={loading}>
                  {loading ? 'Criando...' : 'Criar Casa Parceira'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}