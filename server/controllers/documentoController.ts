import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import storageService from '../services/minioStorageService';

// Inicializar o cliente Prisma
const prisma = new PrismaClient();

// Estender a interface Request para incluir file do multer
interface RequestWithFile extends Request {
  file?: {
    buffer: Buffer;
    originalname: string;
    mimetype: string;
    size: number;
  };
}

// Criar documento (upload de arquivo + registro no BD)
export const createDocumento = async (req: RequestWithFile, res: Response): Promise<void> => {
  if (!req.file) {
    res.status(400).json({ error: 'Nenhum arquivo enviado' });
    return;
  }

  try {
    const { projetoId, atividadeId } = req.body;
    const folder = req.query.folder as string || 'general';
    
    console.log('Iniciando upload de arquivo:', {
      filename: req.file.originalname,
      size: req.file.size,
      mimetype: req.file.mimetype,
      folder,
      projetoId: projetoId || 'não informado',
      atividadeId: atividadeId || 'não informado'
    });
    
    try {
      // Fazer upload para o S3/MinIO
      const { url, key } = await storageService.uploadFile(
        req.file.buffer,
        req.file.originalname,
        folder
      );
      
      console.log('Upload para S3 concluído com sucesso:', { url, key });
      
      try {
        // Criar registro no banco de dados
        const documento = await prisma.documento.create({
          data: {
            nome: req.file.originalname,
            key,
            url,
            tamanho: req.file.size,
            tipo: req.file.mimetype,
            projetoId: projetoId || null,
            atividadeId: atividadeId || null
          },
          include: {
            projeto: {
              select: {
                id: true,
                name: true,
              }
            },
            atividade: {
              select: {
                id: true,
                nome: true,
              }
            }
          }
        });
        
        console.log('Documento criado com sucesso no banco de dados:', { id: documento.id });
        res.status(201).json(documento);
      } catch (dbErr) {
        const dbError = dbErr as Error;
        console.error('Erro ao salvar no banco de dados:', dbError);
        // Se falhar na criação do registro no BD, podemos tentar excluir o arquivo
        try {
          await storageService.deleteFile(key);
          console.log('Arquivo excluído após falha no banco de dados:', key);
        } catch (deleteErr) {
          const deleteError = deleteErr as Error;
          console.error('Erro ao excluir arquivo após falha no banco:', deleteError);
        }
        throw dbError;
      }
    } catch (upErr) {
      const uploadError = upErr as Error;
      console.error('Erro específico no upload para S3:', uploadError.message);
      console.error('Detalhes do erro S3:', uploadError);
      throw uploadError;
    }
  } catch (err) {
    const error = err as Error;
    const errorMessage = error.message || 'Falha ao criar documento';
    console.error('Erro completo ao criar documento:', error);
    res.status(500).json({ 
      error: errorMessage, 
      details: error.stack,
      code: 'code' in error ? error.code : undefined,
      time: new Date().toISOString()
    });
  }
}; 