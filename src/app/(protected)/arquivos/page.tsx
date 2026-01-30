'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Download, Trash2 } from 'lucide-react';
import FileUpload from '@/components/FileUpload';
import { buildApiUrl, API_CONFIG } from '@/config/api';

interface FileInfo {
  id: string;
  nome: string;
  url?: string;
  key: string;
  tamanho?: number;
  tipo?: string;
  pasta?: string;
  projetoId?: string;
  atividadeId?: string;
  createdAt: string;
  updatedAt?: string;
  projeto?: {
    id: string;
    name: string;
  };
  atividade?: {
    id: string;
    nome: string;
  };
}

export default function ArquivosPage() {
  const { token } = useAuth();
  const [files, setFiles] = useState<FileInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [activeFolder, setActiveFolder] = useState('general');
  const [deleteLoading, setDeleteLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchFiles();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFolder, token]);

  const fetchFiles = async () => {
    if (!token) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENTS)}?pasta=${activeFolder}`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Falha ao carregar arquivos' }));
        throw new Error(errorData.detail || 'Falha ao carregar arquivos');
      }

      const data: FileInfo[] = await response.json();
      setFiles(data);
    } catch (err) {
      console.error('Erro ao carregar arquivos:', err);
      const errorMessage = err instanceof Error ? err.message : 'Não foi possível carregar os arquivos. Por favor, tente novamente.';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Tem certeza que deseja excluir este arquivo?')) {
      return;
    }

    setDeleteLoading(id);
    setError(null);
    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENTS)}/${id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Falha ao excluir arquivo' }));
        throw new Error(errorData.detail || 'Falha ao excluir arquivo');
      }
      setFiles(files.filter((file) => file.id !== id));
    } catch (err) {
      console.error('Erro ao excluir arquivo:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao excluir arquivo.';
      setError(errorMessage);
    } finally {
      setDeleteLoading(null);
    }
  };

  const handleDownload = async (id: string) => {
    if(!token) return;
    setError(null);
    try {
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENTS)}/${id}/download`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        mode: 'cors',
        credentials: 'omit',
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: 'Falha ao gerar link de download' }));
        throw new Error(errorData.detail || 'Falha ao gerar link de download');
      }

      const data = await response.json();
      if (data.url) {
        window.open(data.url, '_blank');
      } else {
        throw new Error('URL de download não recebida do servidor.');
      }
    } catch (err) {
      console.error('Erro ao fazer download:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha ao fazer download do arquivo.';
      setError(errorMessage);
    }
  };

  const handleUploadComplete = () => {
    fetchFiles(); // Recarregar a lista de arquivos da pasta ativa
  };

  const formatFileSize = (bytes?: number) => {
    if (bytes === undefined || bytes === null) return 'Desconhecido';
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
  };

  const handleFolderChange = (value: string) => {
    setActiveFolder(value);
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold mb-6">Gerenciador de Arquivos</h1>

      {error && (
        <Alert variant="destructive" className="mb-4">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      <Tabs
        defaultValue={activeFolder}
        onValueChange={handleFolderChange}
        className="mb-6"
      >
        <TabsList>
          <TabsTrigger value="general">Geral</TabsTrigger>
          <TabsTrigger value="images">Imagens</TabsTrigger>
          <TabsTrigger value="documents">Documentos</TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Upload de Arquivos para &quot;{activeFolder}&quot;</CardTitle>
          </CardHeader>
          <CardContent>
            <FileUpload
              folder={activeFolder}
              onUploadComplete={handleUploadComplete}
              accept="image/*,application/pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt"
              // maxSize removido - aceita qualquer tamanho
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Arquivos em &quot;{activeFolder}&quot;</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center items-center h-40">
                <Loader2 className="h-8 w-8 animate-spin" />
                <p className="ml-2">Carregando arquivos...</p>
              </div>
            ) : files.length === 0 ? (
              <p className="text-center text-muted-foreground py-10">
                Nenhum arquivo encontrado nesta pasta.
              </p>
            ) : (
              <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2">
                {files.map((file) => (
                  <div
                    key={file.id}
                    className="flex items-center justify-between border p-3 rounded-md shadow-sm hover:shadow-md transition-shadow duration-150"
                  >
                    <div className="flex-1 overflow-hidden mr-2">
                      <p className="font-medium truncate text-sm" title={file.nome}>{file.nome}</p>
                      <p className="text-xs text-muted-foreground">
                        {formatFileSize(file.tamanho)} - {file.tipo}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Upload: {new Date(file.createdAt).toLocaleDateString()} {new Date(file.createdAt).toLocaleTimeString()}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      {file.url && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(file.url, '_blank')}
                          title="Abrir/Visualizar Arquivo"
                        >
                          <Download className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Abrir</span>
                        </Button>
                      )}
                      {!file.url && (
                         <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDownload(file.id)}
                          title="Baixar Arquivo"
                        >
                          <Download className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Baixar</span>
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleDelete(file.id)}
                        disabled={deleteLoading === file.id}
                        title="Excluir Arquivo"
                      >
                        {deleteLoading === file.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <><Trash2 className="h-4 w-4 mr-1 md:mr-2" /> <span className="hidden md:inline">Excluir</span></>
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
} 