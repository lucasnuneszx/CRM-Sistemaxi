"use client";

import { useState, useEffect, useRef } from "react";
import { X, Upload, AlertCircle, CheckCircle, FileText, Image, Video, Music, Plus, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildApiUrl } from "@/config/api";
import { useAuth } from "@/context/AuthContext";

interface Projeto {
  id: string;
  name: string;
}

interface NovoCriativoModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface FileWithData {
  file: File;
  titulo: string;
  descricao: string;
}

export function NovoCriativoModal({ isOpen, onClose, onSuccess }: NovoCriativoModalProps) {
  const { token, user } = useAuth();
  const [loading, setLoading] = useState(false);
  const [projetos, setProjetos] = useState<Projeto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [selectedFiles, setSelectedFiles] = useState<FileWithData[]>([]);
  const [uploadProgress, setUploadProgress] = useState<{ [key: string]: number }>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Check if user is admin
  const isAdmin = user?.is_admin === true;
  
  // Form data comum para todos os arquivos
  const [commonData, setCommonData] = useState({
    projeto_id: isAdmin ? "" : "auto",
    prazo: ""
  });

  // Carregar projetos quando o modal abrir (apenas para admins)
  useEffect(() => {
    if (isOpen && token && isAdmin) {
      fetchProjetos();
    }
  }, [isOpen, token, isAdmin]);

  const fetchProjetos = async () => {
    try {
      const response = await fetch(buildApiUrl("/v1/projects"), {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });

      if (response.ok) {
        const data = await response.json();
        setProjetos(Array.isArray(data) ? data : []);
      } else {
        console.error("Erro ao carregar projetos");
      }
    } catch (error) {
      console.error("Erro ao carregar projetos:", error);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    
    if (files.length === 0) return;

    const validFiles: FileWithData[] = [];
    let hasError = false;

    for (const file of files) {
      // Verificar tamanho do arquivo (máximo 50MB)
      if (file.size > 50 * 1024 * 1024) {
        setError(`Arquivo "${file.name}" muito grande. Tamanho máximo: 50MB`);
        hasError = true;
        break;
      }

      // Gerar título baseado no nome do arquivo
      const titulo = file.name.replace(/\.[^/.]+$/, ""); // Remove extensão

      validFiles.push({
        file,
        titulo,
        descricao: ""
      });
    }

    if (!hasError) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
      setError(null);
    }
  };

  const updateFileData = (index: number, field: 'titulo' | 'descricao', value: string) => {
    setSelectedFiles(prev => prev.map((item, i) => 
      i === index ? { ...item, [field]: value } : item
    ));
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const getFileIcon = (file: File) => {
    const type = file.type;
    if (type.startsWith('image/')) return <Image className="h-4 w-4" />;
    if (type.startsWith('video/')) return <Video className="h-4 w-4" />;
    if (type.startsWith('audio/')) return <Music className="h-4 w-4" />;
    return <FileText className="h-4 w-4" />;
  };

  const getFileTypeFromMime = (mimeType: string): string => {
    if (mimeType.startsWith('image/')) return 'imagem';
    if (mimeType.startsWith('video/')) return 'video';
    if (mimeType.startsWith('audio/')) return 'audio';
    if (mimeType.includes('pdf')) return 'pdf';
    if (mimeType.includes('document') || mimeType.includes('doc')) return 'documento';
    if (mimeType.includes('spreadsheet') || mimeType.includes('excel')) return 'planilha';
    return 'documento';
  };

  const uploadSingleFile = async (fileData: FileWithData, index: number): Promise<boolean> => {
    try {
      const formDataUpload = new FormData();
      formDataUpload.append('file', fileData.file);
      formDataUpload.append('titulo', fileData.titulo);
      formDataUpload.append('descricao', fileData.descricao || '');
      formDataUpload.append('tipo_arquivo', getFileTypeFromMime(fileData.file.type));
      formDataUpload.append('prioridade', 'media');
      
      if (commonData.prazo) {
        formDataUpload.append('prazo', new Date(commonData.prazo).toISOString());
      }
      
      if (isAdmin && commonData.projeto_id) {
        formDataUpload.append('projeto_id', commonData.projeto_id);
      }

      const response = await fetch(buildApiUrl("/v1/criativos"), {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`
        },
        body: formDataUpload
      });

      if (response.ok) {
        setUploadProgress(prev => ({ ...prev, [index]: 100 }));
        return true;
      } else {
        const errorData = await response.text();
        console.error(`Erro ao criar criativo "${fileData.titulo}":`, errorData);
        return false;
      }
    } catch (error) {
      console.error(`Erro ao fazer upload de "${fileData.titulo}":`, error);
      return false;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validação
    if (selectedFiles.length === 0) {
      setError("Selecione pelo menos um arquivo");
      return;
    }

    // Verificar se todos os títulos estão preenchidos
    const filesWithoutTitle = selectedFiles.filter(f => !f.titulo.trim());
    if (filesWithoutTitle.length > 0) {
      setError("Todos os arquivos devem ter um título");
      return;
    }

    if (isAdmin && !commonData.projeto_id) {
      setError("Selecione um projeto");
      return;
    }

    setLoading(true);
    setError(null);
    setUploadProgress({});

    try {
      let successCount = 0;
      let totalFiles = selectedFiles.length;

      // Upload sequencial para evitar sobrecarga
      for (let i = 0; i < selectedFiles.length; i++) {
        const fileData = selectedFiles[i];
        setUploadProgress(prev => ({ ...prev, [i]: 0 }));
        
        const success = await uploadSingleFile(fileData, i);
        if (success) {
          successCount++;
        }
      }

      if (successCount === totalFiles) {
        // Todos os uploads foram bem-sucedidos
        handleClose();
        onSuccess();
      } else if (successCount > 0) {
        // Alguns uploads foram bem-sucedidos
        setError(`${successCount} de ${totalFiles} arquivos foram enviados com sucesso. Verifique os arquivos com erro.`);
        onSuccess(); // Atualizar a lista mesmo com alguns erros
      } else {
        // Nenhum upload foi bem-sucedido
        setError("Nenhum arquivo foi enviado com sucesso. Tente novamente.");
      }
    } catch (error) {
      console.error("Erro geral no upload:", error);
      setError("Erro de conexão. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setCommonData({
        projeto_id: isAdmin ? "" : "auto",
        prazo: ""
      });
      setSelectedFiles([]);
      setUploadProgress({});
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      setError(null);
      onClose();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5 text-blue-600" />
            Novo Material Criativo
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Upload de Arquivos */}
          <div className="space-y-2">
            <Label htmlFor="arquivo">Arquivos</Label>
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors">
              <input
                ref={fileInputRef}
                type="file"
                id="arquivo"
                onChange={handleFileSelect}
                disabled={loading}
                className="hidden"
                multiple
                accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx"
              />
              
              <label
                htmlFor="arquivo"
                className="flex flex-col items-center gap-2 cursor-pointer"
              >
                <Upload className="h-8 w-8 text-gray-400" />
                <div className="text-center">
                  <p className="text-sm font-medium">Clique para enviar arquivos</p>
                  <p className="text-xs text-gray-500">
                    Múltiplos arquivos: imagens, vídeos, documentos (máx. 50MB cada)
                  </p>
                </div>
              </label>
            </div>
          </div>

          {/* Lista de Arquivos Selecionados */}
          {selectedFiles.length > 0 && (
            <div className="space-y-3">
              <Label>Arquivos Selecionados ({selectedFiles.length})</Label>
              <div className="max-h-60 overflow-y-auto space-y-3 border rounded-lg p-3 bg-gray-50">
                {selectedFiles.map((fileData, index) => (
                  <div key={index} className="bg-white rounded-lg p-3 border">
                    <div className="flex items-start gap-3">
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        {getFileIcon(fileData.file)}
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <p className="text-sm font-medium truncate">
                              {fileData.file.name}
                            </p>
                            <p className="text-xs text-gray-500 whitespace-nowrap">
                              {(fileData.file.size / (1024 * 1024)).toFixed(2)} MB
                            </p>
                          </div>
                          
                          {/* Progress bar durante upload */}
                          {loading && uploadProgress[index] !== undefined && (
                            <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                                style={{ width: `${uploadProgress[index]}%` }}
                              />
                            </div>
                          )}
                          
                          <div className="space-y-2">
                            <Input
                              placeholder="Título do material"
                              value={fileData.titulo}
                              onChange={(e) => updateFileData(index, 'titulo', e.target.value)}
                              disabled={loading}
                              required
                              className="text-sm"
                            />
                            <Input
                              placeholder="Descrição (opcional)"
                              value={fileData.descricao}
                              onChange={(e) => updateFileData(index, 'descricao', e.target.value)}
                              disabled={loading}
                              className="text-sm"
                            />
                          </div>
                        </div>
                      </div>
                      
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeFile(index)}
                        disabled={loading}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Dados Comuns */}
          <div className="space-y-4 border-t pt-4">
            <Label className="text-base font-medium">Configurações Comuns</Label>
            
            {/* Projeto - apenas para admins */}
            {isAdmin && (
              <div className="space-y-2">
                <Label>
                  Projeto <span className="text-red-500">*</span>
                </Label>
                <Select
                  value={commonData.projeto_id}
                  onValueChange={(value) => setCommonData(prev => ({ ...prev, projeto_id: value }))}
                  disabled={loading}
                  required
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o projeto" />
                  </SelectTrigger>
                  <SelectContent>
                    {projetos.map((projeto) => (
                      <SelectItem key={projeto.id} value={projeto.id}>
                        {projeto.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* Prazo */}
            <div className="space-y-2">
              <Label htmlFor="prazo">Prazo (aplicado a todos)</Label>
              <Input
                id="prazo"
                type="datetime-local"
                value={commonData.prazo}
                onChange={(e) => setCommonData(prev => ({ ...prev, prazo: e.target.value }))}
                disabled={loading}
              />
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700">
              <AlertCircle className="h-4 w-4" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              type="submit"
              disabled={loading || selectedFiles.length === 0 || (isAdmin && !commonData.projeto_id)}
            >
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Enviando {selectedFiles.length} arquivo{selectedFiles.length > 1 ? 's' : ''}...
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4 mr-2" />
                  Criar {selectedFiles.length} Material{selectedFiles.length > 1 ? 'is' : ''}
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
} 