#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Mapeamento de URLs antigas para novas configurações
const URL_MAPPINGS = {
  // Projetos
  'http://localhost:3001/api/projects': 'buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS)',
  'http://localhost:3001/api/v1/projects': 'buildApiUrl(API_CONFIG.ENDPOINTS.PROJECTS_V1)',
  
  // Usuários
  'http://localhost:3001/api/v1/users': 'buildApiUrl(API_CONFIG.ENDPOINTS.USERS)',
  'http://localhost:3001/api/users': 'buildApiUrl(API_CONFIG.ENDPOINTS.USERS)',
  'http://localhost:3001/api/users/for-assignment': 'buildApiUrl(API_CONFIG.ENDPOINTS.USERS_FOR_ASSIGNMENT)',
  
  // Atividades
  'http://localhost:3001/api/v1/atividades': 'buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES)',
  'http://localhost:3001/api/atividades': 'buildApiUrl(API_CONFIG.ENDPOINTS.ACTIVITIES_OLD)',
  
  // Setores
  'http://localhost:3001/api/setores': 'buildApiUrl(API_CONFIG.ENDPOINTS.SECTORS)',
  
  // Documentos
  'http://localhost:3001/api/documentos': 'buildApiUrl(API_CONFIG.ENDPOINTS.DOCUMENTS)',
  
  // Team Members
  'http://localhost:3001/api/team-members': 'buildApiUrl(API_CONFIG.ENDPOINTS.TEAM_MEMBERS)',
  
  // Relatórios Diários
  'http://localhost:3001/api/v1/relatorios-diarios': 'buildApiUrl(API_CONFIG.ENDPOINTS.DAILY_REPORTS)',
  
  // Métricas Redes Sociais
  'http://localhost:3001/api/v1/metricas-redes-sociais': 'buildApiUrl(API_CONFIG.ENDPOINTS.SOCIAL_METRICS)',
  
  // Casas Parceiras
  'http://localhost:3001/api/v1/casas-parceiras': 'buildApiUrl(API_CONFIG.ENDPOINTS.PARTNER_HOUSES)',
  
  // Credenciais
  'http://localhost:3001/api/v1/credenciais-acesso': 'buildApiUrl(API_CONFIG.ENDPOINTS.CREDENTIALS)',
};

// Padrões mais complexos que precisam de tratamento especial
const COMPLEX_PATTERNS = [
  {
    pattern: /http:\/\/localhost:3001\/api\/v1\/projects\/\$\{([^}]+)\}/g,
    replacement: 'getProjectUrl($1)'
  },
  {
    pattern: /http:\/\/localhost:3001\/api\/v1\/atividades\/projeto\/\$\{([^}]+)\}/g,
    replacement: 'getProjectActivityUrl($1)'
  },
  {
    pattern: /http:\/\/localhost:3001\/api\/v1\/relatorios-diarios\/projeto\/\$\{([^}]+)\}/g,
    replacement: 'getProjectReportsUrl($1)'
  },
  {
    pattern: /http:\/\/localhost:3001\/api\/v1\/metricas-redes-sociais\/projeto\/\$\{([^}]+)\}/g,
    replacement: 'getProjectSocialMetricsUrl($1)'
  },
  {
    pattern: /http:\/\/localhost:3001\/api\/v1\/casas-parceiras\/projeto\/\$\{([^}]+)\}/g,
    replacement: 'getProjectPartnerHousesUrl($1)'
  }
];

function findTSXFiles(dir) {
  const files = [];
  const items = fs.readdirSync(dir);
  
  for (const item of items) {
    const fullPath = path.join(dir, item);
    const stat = fs.statSync(fullPath);
    
    if (stat.isDirectory() && !item.startsWith('.') && item !== 'node_modules') {
      files.push(...findTSXFiles(fullPath));
    } else if (item.endsWith('.tsx') || item.endsWith('.ts')) {
      files.push(fullPath);
    }
  }
  
  return files;
}

function updateFile(filePath) {
  console.log(`📝 Atualizando: ${filePath}`);
  
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  // Verificar se já tem o import
  const hasApiImport = content.includes('from \'@/config/api\'') || content.includes('from "@/config/api"');
  
  // Aplicar substituições simples
  for (const [oldUrl, newUrl] of Object.entries(URL_MAPPINGS)) {
    if (content.includes(oldUrl)) {
      content = content.replace(new RegExp(escapeRegExp(oldUrl), 'g'), newUrl);
      hasChanges = true;
    }
  }
  
  // Aplicar padrões complexos
  for (const { pattern, replacement } of COMPLEX_PATTERNS) {
    if (pattern.test(content)) {
      content = content.replace(pattern, replacement);
      hasChanges = true;
    }
  }
  
  // Adicionar import se necessário e houve mudanças
  if (hasChanges && !hasApiImport) {
    // Encontrar a última linha de import
    const lines = content.split('\n');
    let lastImportIndex = -1;
    
    for (let i = 0; i < lines.length; i++) {
      if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('} from ')) {
        lastImportIndex = i;
      }
    }
    
    if (lastImportIndex !== -1) {
      lines.splice(lastImportIndex + 1, 0, 'import { buildApiUrl, buildBaseUrl, API_CONFIG, getProjectUrl, getProjectActivityUrl, getProjectReportsUrl, getProjectSocialMetricsUrl, getProjectPartnerHousesUrl } from \'@/config/api\';');
      content = lines.join('\n');
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`✅ Atualizado: ${filePath}`);
    return true;
  }
  
  return false;
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function main() {
  console.log('🚀 Iniciando atualização de URLs da API...\n');
  
  const srcDir = path.join(process.cwd(), 'src');
  const files = findTSXFiles(srcDir);
  
  console.log(`📁 Encontrados ${files.length} arquivos para verificar\n`);
  
  let updatedCount = 0;
  
  for (const file of files) {
    if (updateFile(file)) {
      updatedCount++;
    }
  }
  
  console.log(`\n🎉 Processo concluído!`);
  console.log(`📊 Arquivos atualizados: ${updatedCount}/${files.length}`);
  
  if (updatedCount > 0) {
    console.log('\n📝 Para aplicar as mudanças:');
    console.log('git add .');
    console.log('git commit -m "feat: Atualizar todas as URLs da API para usar configuração centralizada"');
    console.log('git push origin main');
  }
}

if (require.main === module) {
  main();
}

module.exports = { updateFile, findTSXFiles }; 