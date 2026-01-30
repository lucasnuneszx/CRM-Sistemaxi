import * as Minio from 'minio';
import dotenv from 'dotenv';

// Carregar variáveis de ambiente
dotenv.config();

// Obter configurações do ambiente
const logConfig = () => {
  console.log('Variáveis de ambiente:');
  console.log('S3_ENDPOINT:', process.env.S3_ENDPOINT);
  console.log('S3_ACCESS_KEY definido:', !!process.env.S3_ACCESS_KEY);
  console.log('S3_SECRET_KEY definido:', !!process.env.S3_SECRET_KEY);
  console.log('S3_BUCKET:', process.env.S3_BUCKET);
};

// Imprimir a configuração
logConfig();

// Separar host e porta do endpoint
const envEndpoint = process.env.S3_ENDPOINT || 's3.sellhuub.com:9000';
let host: string, port: number;

if (envEndpoint.includes(':')) {
  [host, port] = envEndpoint.split(':');
  port = parseInt(port, 10);
} else {
  host = envEndpoint;
  port = 9000; // Porta padrão do MinIO
}

// Remover protocolo se presente
host = host.replace(/^https?:\/\//, '');

// Mostrar config processado
console.log('Configuração processada:');
console.log('Host:', host);
console.log('Port:', port);

// Configurar cliente MinIO
const minioClient = new Minio.Client({
  endPoint: host,
  port: port,
  useSSL: false,
  accessKey: process.env.S3_ACCESS_KEY || '',
  secretKey: process.env.S3_SECRET_KEY || ''
});

// Função para testar a conexão
const testConnection = async () => {
  try {
    console.log('Listando buckets...');
    const buckets = await minioClient.listBuckets();
    console.log('Buckets disponíveis:', buckets.map(b => b.name).join(', '));
    
    // Bucket para teste
    const bucketName = process.env.S3_BUCKET || 'squad';
    console.log('Verificando bucket:', bucketName);
    
    // Verificar se o bucket existe
    const bucketExists = await minioClient.bucketExists(bucketName);
    console.log('Bucket existe?', bucketExists);
    
    if (!bucketExists) {
      console.log('Criando bucket:', bucketName);
      await minioClient.makeBucket(bucketName, 'us-east-1');
      console.log('Bucket criado com sucesso!');
    }
    
    // Testar upload
    const testKey = `test-${Date.now()}.txt`;
    const testContent = Buffer.from('Teste de conexão');
    
    console.log('Enviando arquivo de teste...');
    await minioClient.putObject(
      bucketName,
      testKey,
      testContent,
      testContent.length,
      { 'Content-Type': 'text/plain' }
    );
    console.log('Arquivo enviado com sucesso!');
    
    // Obter URL pré-assinada
    console.log('Gerando URL para download...');
    const url = await minioClient.presignedGetObject(bucketName, testKey, 3600);
    console.log('URL de download:', url);
    
    // Listar objetos
    console.log('Listando objetos no bucket...');
    const objects: Minio.BucketItem[] = [];
    const stream = minioClient.listObjects(bucketName, '', true);
    
    await new Promise((resolve, reject) => {
      stream.on('data', (obj) => {
        objects.push(obj);
      });
      
      stream.on('error', (err) => {
        console.error('Erro ao listar objetos:', err);
        reject(err);
      });
      
      stream.on('end', () => {
        console.log(`${objects.length} objetos encontrados`);
        resolve(null);
      });
    });
    
    // Excluir objeto de teste
    console.log('Excluindo arquivo de teste...');
    await minioClient.removeObject(bucketName, testKey);
    console.log('Arquivo excluído com sucesso!');
    
    console.log('Teste completo com sucesso!');
  } catch (error) {
    console.error('Erro no teste de conexão:', error);
  }
};

// Executar o teste
testConnection()
  .then(() => console.log('Teste finalizado'))
  .catch((err) => console.error('Falha no teste:', err)); 