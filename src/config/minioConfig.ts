import * as Minio from 'minio';

// Obter configurações do ambiente
const envEndpoint = process.env.S3_ENDPOINT || 's3.sellhuub.com:9000';

// Separar host e porta
let host, port;
if (envEndpoint.includes(':')) {
  [host, port] = envEndpoint.split(':');
  port = parseInt(port, 10);
} else {
  host = envEndpoint;
  port = 9000; // Porta padrão do MinIO
}

// Remover protocolo se presente
host = host.replace(/^https?:\/\//, '');

const accessKey = process.env.S3_ACCESS_KEY || '';
const secretKey = process.env.S3_SECRET_KEY || '';
export const bucketName = process.env.S3_BUCKET || 'sistemaxi';

// Criar cliente MinIO
export const minioClient = new Minio.Client({
  endPoint: host,
  port: port,
  useSSL: false,
  accessKey: accessKey,
  secretKey: secretKey
});

// Verificar conexão e bucket
export const initMinioClient = async () => {
  try {
    // Verificar se o bucket existe
    const exists = await minioClient.bucketExists(bucketName);
    if (!exists) {
      console.log(`Bucket '${bucketName}' não existe, tentando criar...`);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log(`Bucket '${bucketName}' criado com sucesso!`);
    } else {
      console.log(`Bucket '${bucketName}' encontrado!`);
    }
    return { success: true, message: 'Conexão com MinIO estabelecida com sucesso' };
  } catch (err) {
    const error = err as Error;
    console.error('Erro ao inicializar cliente MinIO:', error);
    return { 
      success: false, 
      message: `Erro ao conectar ao MinIO: ${error.message}`, 
      details: { stack: error.stack } 
    };
  }
};

// Inicializar na importação
initMinioClient()
  .then(result => {
    console.log('Status da inicialização MinIO:', result.message);
  })
  .catch(err => {
    console.error('Falha na inicialização MinIO:', err);
  });

export default minioClient; 