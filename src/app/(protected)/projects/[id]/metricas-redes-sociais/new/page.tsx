'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { ArrowLeft, Save, MessageCircle, Facebook } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from '@/config/api';

interface FormData {
  data_referente: string;
  seguidores_instagram: string;
  inscritos_telegram: string;
  leads_whatsapp: string;
  seguidores_facebook: string;
  inscritos_youtube: string;
  seguidores_tiktok: string;
  observacoes: string;
}

export default function NovaMetricaPage() {
  const { id: projectId } = useParams();
  const router = useRouter();
  const { token } = useAuth();
  
  const [projeto, setProjeto] = useState<{ name: string } | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<FormData>({
    data_referente: new Date().toISOString().split('T')[0], // Data de hoje
    seguidores_instagram: '',
    inscritos_telegram: '',
    leads_whatsapp: '',
    seguidores_facebook: '',
    inscritos_youtube: '',
    seguidores_tiktok: '',
    observacoes: ''
  });

  const fetchProjeto = async () => {
    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)}/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error('Erro ao carregar projeto');
      }

      const data = await response.json();
      setProjeto(data);
    } catch (err) {
      console.error('Erro ao carregar projeto:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token && projectId) {
      fetchProjeto();
    }
  }, [token, projectId]);

  const handleInputChange = (field: keyof FormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);

    try {
      // Converter strings vazias para null e números para integer
      const payload = {
        projeto_id: projectId,
        data_referente: formData.data_referente,
        seguidores_instagram: formData.seguidores_instagram ? parseInt(formData.seguidores_instagram) : null,
        inscritos_telegram: formData.inscritos_telegram ? parseInt(formData.inscritos_telegram) : null,
        leads_whatsapp: formData.leads_whatsapp ? parseInt(formData.leads_whatsapp) : null,
        seguidores_facebook: formData.seguidores_facebook ? parseInt(formData.seguidores_facebook) : null,
        inscritos_youtube: formData.inscritos_youtube ? parseInt(formData.inscritos_youtube) : null,
        seguidores_tiktok: formData.seguidores_tiktok ? parseInt(formData.seguidores_tiktok) : null,
        observacoes: formData.observacoes || null
      };

      const response = await fetch(buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS), {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Erro desconhecido' }));
        throw new Error(errorData.detail || 'Erro ao criar métrica');
      }

      router.push(`/projects/${projectId}/metricas-redes-sociais`);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro desconhecido');
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto py-8">
        <div className="space-y-6">
          <Skeleton className="h-8 w-1/3" />
          <Skeleton className="h-64" />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Button 
          variant="ghost" 
          onClick={() => router.push(`/projects/${projectId}/metricas-redes-sociais`)}
          className="flex items-center"
        >
          <ArrowLeft className="mr-2 h-4 w-4" /> Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold">Nova Métrica de Redes Sociais</h1>
          {projeto && (
            <p className="text-muted-foreground">Projeto: {projeto.name}</p>
          )}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar Métricas do Dia</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Data de Referência */}
            <div>
              <Label htmlFor="data_referente">Data de Referência *</Label>
              <Input
                id="data_referente"
                type="date"
                value={formData.data_referente}
                onChange={(e) => handleInputChange('data_referente', e.target.value)}
                required
              />
            </div>

            {/* Grid de Redes Sociais */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Instagram */}
              <Card className="border-l-4 border-l-purple-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">Instagram</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="seguidores_instagram">Seguidores</Label>
                    <Input
                      id="seguidores_instagram"
                      type="number"
                      min="0"
                      value={formData.seguidores_instagram}
                      onChange={(e) => handleInputChange('seguidores_instagram', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Telegram */}
              <Card className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">Telegram</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="inscritos_telegram">Inscritos</Label>
                    <Input
                      id="inscritos_telegram"
                      type="number"
                      min="0"
                      value={formData.inscritos_telegram}
                      onChange={(e) => handleInputChange('inscritos_telegram', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* WhatsApp */}
              <Card className="border-l-4 border-l-green-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">WhatsApp</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="leads_whatsapp">Leads</Label>
                    <Input
                      id="leads_whatsapp"
                      type="number"
                      min="0"
                      value={formData.leads_whatsapp}
                      onChange={(e) => handleInputChange('leads_whatsapp', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* Facebook */}
              <Card className="border-l-4 border-l-indigo-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Facebook className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">Facebook</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="seguidores_facebook">Seguidores</Label>
                    <Input
                      id="seguidores_facebook"
                      type="number"
                      min="0"
                      value={formData.seguidores_facebook}
                      onChange={(e) => handleInputChange('seguidores_facebook', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* YouTube */}
              <Card className="border-l-4 border-l-red-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">YouTube</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="inscritos_youtube">Inscritos</Label>
                    <Input
                      id="inscritos_youtube"
                      type="number"
                      min="0"
                      value={formData.inscritos_youtube}
                      onChange={(e) => handleInputChange('inscritos_youtube', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>

              {/* TikTok */}
              <Card className="border-l-4 border-l-gray-500">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 bg-gradient-to-r from-gray-700 to-slate-700 rounded-lg flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-white" />
                    </div>
                    <CardTitle className="text-lg">TikTok</CardTitle>
                  </div>
                </CardHeader>
                <CardContent>
                  <div>
                    <Label htmlFor="seguidores_tiktok">Seguidores</Label>
                    <Input
                      id="seguidores_tiktok"
                      type="number"
                      min="0"
                      value={formData.seguidores_tiktok}
                      onChange={(e) => handleInputChange('seguidores_tiktok', e.target.value)}
                      placeholder="0"
                    />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Observações */}
            <div>
              <Label htmlFor="observacoes">Observações</Label>
              <Textarea
                id="observacoes"
                value={formData.observacoes}
                onChange={(e) => handleInputChange('observacoes', e.target.value)}
                placeholder="Observações sobre as métricas do dia..."
                rows={3}
              />
            </div>

            {/* Erro */}
            {error && (
              <div className="text-red-500 text-sm">
                {error}
              </div>
            )}

            {/* Botões */}
            <div className="flex gap-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push(`/projects/${projectId}/metricas-redes-sociais`)}
                disabled={saving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={saving}>
                <Save className="mr-2 h-4 w-4" />
                {saving ? 'Salvando...' : 'Salvar Métrica'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 