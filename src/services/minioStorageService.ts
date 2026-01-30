import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { minioClient, bucketName } from '../config/minioConfig';

interface ObjectInfo {
  Key: string;
  Size: number;
  LastModified: Date;
}

interface ConnectionResult {
  success: boolean;
  message: string;
  details?: Record<string, unknown>;
}

/**
 * Serviço para gerenciar operações de armazenamento com MinIO
 * usando o cliente oficial do MinIO
 */
class MinioStorageService {
  /**
   * Faz upload de um arquivo para o bucket do MinIO
   * @param file Buffer do arquivo
   * @param filename Nome original do arquivo
   * @param folder Pasta opcional onde armazenar o arquivo
   * @returns URL do arquivo enviado e o caminho relativo
   */
  async uploadFile(file: Buffer, filename: string, folder: string = 'general'): Promise<{url: string, key: string}> {
    // Gera um nome de arquivo único para evitar colisões
    const fileExt = path.extname(filename);
    const uniqueFilename = `${uuidv4()}${fileExt}`;
    const key = `${folder}/${uniqueFilename}`;

    // Determinar o Content-Type com base na extensão
    const contentType = this.getContentType(fileExt);

    console.log('Iniciando upload para MinIO:', {
      filename,
      folder,
      key,
      contentType,
      size: file.length
    });

    try {
      // Verificar se o bucket existe, se não, criar
      const bucketExists = await minioClient.bucketExists(bucketName);
      if (!bucketExists) {
        console.log(`Bucket '${bucketName}' não existe, criando...`);
        await minioClient.makeBucket(bucketName, 'us-east-1');
      }

      // Fazer upload do arquivo usando o cliente MinIO
      await minioClient.putObject(
        bucketName,
        key,
        file,
        file.length,
        { 'Content-Type': contentType }
      );

      console.log('Upload concluído com sucesso para MinIO');

      // Gerar URL para o objeto
      const url = await this.getObjectUrl(key);
      
      return { url, key };
    } catch (error) {
      console.error('Erro no upload para MinIO:', error);
      throw error;
    }
  }

  /**
   * Exclui um arquivo do bucket
   * @param key Caminho do arquivo
   */
  async deleteFile(key: string): Promise<void> {
    console.log('Excluindo arquivo do MinIO:', { bucket: bucketName, key });
    
    try {
      await minioClient.removeObject(bucketName, key);
      console.log('Arquivo excluído com sucesso do MinIO');
    } catch (error) {
      console.error('Erro ao excluir arquivo do MinIO:', error);
      throw error;
    }
  }

  /**
   * Gera um link de download temporário
   * @param key Caminho do arquivo
   * @param expiresIn Tempo de expiração em segundos (padrão: 1 hora)
   * @returns URL temporária para download
   */
  async getSignedUrl(key: string, expiresIn: number = 3600): Promise<string> {
    console.log('Gerando URL assinada para MinIO:', { bucket: bucketName, key });
    
    try {
      const url = await minioClient.presignedGetObject(bucketName, key, expiresIn);
      console.log('URL assinada gerada com sucesso:', url);
      return url;
    } catch (error) {
      console.error('Erro ao gerar URL assinada para MinIO:', error);
      throw error;
    }
  }

  /**
   * Lista todos os arquivos em uma pasta específica
   * @param folder Caminho da pasta (prefixo)
   * @returns Lista de objetos
   */
  async listFiles(folder: string = ''): Promise<ObjectInfo[]> {
    console.log('Listando arquivos no MinIO:', { bucket: bucketName, prefix: folder });
    
    try {
      const stream = minioClient.listObjects(bucketName, folder, true);
      
      return new Promise((resolve, reject) => {
        const objects: ObjectInfo[] = [];
        
        stream.on('data', (obj) => {
          // Verificar e garantir que os campos estão presentes
          if (obj.name && obj.lastModified) {
            // Converter explicitamente para evitar erros de tipo
            objects.push({
              Key: String(obj.name), // Garantir que é uma string
              Size: typeof obj.size === 'number' ? obj.size : 0,
              LastModified: new Date(obj.lastModified) // Garantir que é um Date
            });
          }
        });
        
        stream.on('error', (err) => {
          console.error('Erro ao listar objetos no MinIO:', err);
          reject(err);
        });
        
        stream.on('end', () => {
          console.log(`${objects.length} objetos encontrados no MinIO`);
          resolve(objects);
        });
      });
    } catch (error) {
      console.error('Erro ao listar arquivos no MinIO:', error);
      return [];
    }
  }

  /**
   * Retorna a URL pública de um arquivo
   * @param key Caminho do arquivo
   * @returns URL completa do arquivo
   */
  async getObjectUrl(key: string): Promise<string> {
    // O MinIO geralmente não tem URLs públicas por padrão, então geramos uma URL pré-assinada
    try {
      // Usar uma URL pré-assinada com tempo de expiração longo para simular uma URL pública
      // Em produção, considere configurar o bucket como público ou usar um CDN
      const url = await minioClient.presignedGetObject(bucketName, key, 7 * 24 * 60 * 60); // 7 dias
      return url;
    } catch (error) {
      console.error('Erro ao gerar URL pública:', error);
      // Fallback para URL estática (pode não funcionar sem configurações adicionais)
      // Acessamos as propriedades internas do cliente para obter o host e porta
      const client = minioClient as unknown as { 
        host: string; 
        port: number;
      };
      
      return `http://${client.host}:${client.port}/${bucketName}/${key}`;
    }
  }

  /**
   * Obtem a URL para o arquivo sem necessidade de autenticação
   * @param key Caminho do arquivo
   * @returns URL para acesso direto
   */
  getFileUrl(key: string): string {
    // Usar uma URL básica que aponta para o objeto
    // Note que isso só funciona se o bucket for público
    // Acessamos as propriedades internas do cliente para obter o host e porta
    const client = minioClient as unknown as { 
      host: string; 
      port: number;
    };
    
    return `http://${client.host}:${client.port}/${bucketName}/${key}`;
  }

  /**
   * Testa a conexão com o bucket e sua disponibilidade
   */
  async testBucketConnection(): Promise<ConnectionResult> {
    console.log('Testando conexão com o bucket MinIO:', bucketName);
    
    try {
      // Testar conexão com o servidor
      const buckets = await minioClient.listBuckets();
      console.log('Buckets disponíveis:', buckets.map(b => b.name).join(', '));
      
      // Verificar se o bucket existe
      const bucketExists = await minioClient.bucketExists(bucketName);
      
      if (!bucketExists) {
        console.log(`Bucket '${bucketName}' não encontrado, tentando criar...`);
        try {
          await minioClient.makeBucket(bucketName, 'us-east-1');
          console.log(`Bucket '${bucketName}' criado com sucesso!`);
        } catch (err) {
          const error = err as Error;
          console.error('Erro ao criar bucket:', error);
          return {
            success: false,
            message: `Erro ao criar bucket '${bucketName}'`,
            details: { error: error.message, stack: error.stack }
          };
        }
      }
      
      // Testar upload de um arquivo pequeno
      const testKey = `test-${Date.now()}.txt`;
      const testContent = Buffer.from('Teste de conexão com MinIO');
      
      await minioClient.putObject(
        bucketName,
        testKey,
        testContent,
        testContent.length,
        { 'Content-Type': 'text/plain' }
      );
      
      console.log('Arquivo de teste enviado com sucesso:', testKey);
      
      // Tentar excluir o arquivo de teste
      await minioClient.removeObject(bucketName, testKey);
      console.log('Arquivo de teste excluído com sucesso');
      
      return {
        success: true,
        message: 'Conexão com MinIO estabelecida e bucket está operacional',
        details: {
          bucketExists: true,
          bucketsAvailable: buckets.map(b => b.name)
        }
      };
    } catch (err) {
      const error = err as Error;
      console.error('Erro no teste de conexão com MinIO:', error);
      return {
        success: false,
        message: `Falha ao testar conexão com MinIO: ${error.message}`,
        details: { stack: error.stack }
      };
    }
  }

  /**
   * Determina o Content-Type com base na extensão do arquivo
   */
  private getContentType(fileExt: string): string {
    const contentTypes: {[key: string]: string} = {
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.gif': 'image/gif',
      '.pdf': 'application/pdf',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      '.zip': 'application/zip',
      '.mp4': 'video/mp4',
      '.mp3': 'audio/mpeg',
      '.txt': 'text/plain'
    };
    
    return contentTypes[fileExt.toLowerCase()] || 'application/octet-stream';
  }
}

// Criar instância e testar conexão ao inicializar
const minioStorageService = new MinioStorageService();

export default minioStorageService; 