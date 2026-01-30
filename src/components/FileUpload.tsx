import { useState, useRef, ChangeEvent } from 'react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/context/AuthContext';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, Loader2, Check, X, File } from 'lucide-react';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { buildApiUrl, API_CONFIG } from '@/config/api';

interface FileUploadProps {
  folder?: string;
  onUploadComplete?: (fileInfo: { url: string; key: string; id: string }) => void;
  accept?: string;
  maxSize?: number; // em bytes
  projetoId?: string;
  atividadeId?: string;
}

export default function FileUpload({
  folder = 'general',
  onUploadComplete,
  accept,
  maxSize = 10 * 1024 * 1024, // 10MB por padrão
  projetoId,
  atividadeId
}: FileUploadProps) {
  const { token } = useAuth();
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; key: string; name: string; id: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Removida validação de tamanho - aceita qualquer tamanho
    // if (file.size > maxSize) {
    //   setError(`O arquivo é muito grande. O tamanho máximo é ${maxSize / (1024 * 1024)}MB.`);
    //   return;
    // }

    // Resetar estados
    setIsUploading(true);
    setUploadProgress(0);
    setError(null);
    setSuccess(false);

    try {
      // Criar FormData
      const formData = new FormData();
      formData.append('file', file);
      formData.append('pasta', folder); // Enviar pasta como FormData, não como query parameter
      
      // Adicionar dados de relacionamento se fornecidos
      if (projetoId) {
        formData.append('projetoId', projetoId);
      }
      
      if (atividadeId) {
        formData.append('atividadeId', atividadeId);
      }

      // Simular progresso
      const progressInterval = simulateProgress();

      // Fazer upload usando a nova API de documentos
      // Removido query parameter folder, agora é enviado como FormData
      const response = await fetch(`${buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENTS)}`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          // Não definir Content-Type - o browser define automaticamente com boundary para FormData
        },
        body: formData,
      });

      // Limpar intervalo de progresso
      clearInterval(progressInterval);

      if (!response.ok) {
        let errorMessage = 'Erro ao fazer upload do arquivo';
        try {
          const data = await response.json();
          errorMessage = data.detail || data.error || errorMessage;
        } catch {
          // Se não conseguir parsear JSON, usar status text
          errorMessage = `Erro ${response.status}: ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const data = await response.json();
      
      // Definir progresso como 100% e marcar como sucesso
      setUploadProgress(100);
      setSuccess(true);
      
      // Salvar dados do arquivo
      setUploadedFile({
        url: data.url,
        key: data.key,
        name: data.nome,
        id: data.id
      });
      
      // Notificar o componente pai
      if (onUploadComplete) {
        onUploadComplete({
          url: data.url,
          key: data.key,
          id: data.id
        });
      }
    } catch (err) {
      console.error('Erro no upload:', err);
      setError(err instanceof Error ? err.message : 'Erro ao fazer upload do arquivo');
    } finally {
      setIsUploading(false);
    }
  };

  // Função para simular o progresso do upload
  const simulateProgress = () => {
    let progress = 0;
    return setInterval(() => {
      progress += Math.random() * 10;
      if (progress > 90) {
        progress = 90; // Limitamos a 90% para garantir que 100% só aconteça quando o upload terminar
      }
      setUploadProgress(progress);
    }, 300);
  };

  const triggerFileInput = () => {
    fileInputRef.current?.click();
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardContent className="p-4">
        <div className="flex flex-col items-center gap-4">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            className="hidden"
            accept={accept}
            disabled={isUploading}
          />

          {!uploadedFile ? (
            <Button
              onClick={triggerFileInput}
              disabled={isUploading}
              className="w-full"
            >
              {isUploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Selecionar Arquivo
                </>
              )}
            </Button>
          ) : (
            <div className="flex w-full items-center gap-2 p-2 border rounded bg-muted/50">
              <File className="h-4 w-4 text-primary" />
              <span className="flex-1 truncate text-sm">{uploadedFile.name}</span>
              <Button
                variant="ghost"
                size="icon"
                className="h-6 w-6"
                onClick={() => {
                  setUploadedFile(null);
                  setSuccess(false);
                  if (fileInputRef.current) {
                    fileInputRef.current.value = '';
                  }
                }}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          )}

          {isUploading && (
            <div className="w-full space-y-2">
              <Progress value={uploadProgress} />
              <p className="text-xs text-center text-muted-foreground">
                {Math.round(uploadProgress)}% concluído
              </p>
            </div>
          )}

          {success && !isUploading && (
            <div className="flex items-center gap-2 text-green-600">
              <Check className="h-4 w-4" />
              <span className="text-sm">Upload concluído com sucesso!</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
        </div>
      </CardContent>
    </Card>
  );
} 