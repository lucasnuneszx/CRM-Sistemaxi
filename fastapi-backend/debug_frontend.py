#!/usr/bin/env python3

import requests
import json
from datetime import datetime

# Debug para comparar requisições frontend vs backend
base_url = "http://localhost:3001"
project_id = "7f5241c7-15d3-4aac-bf66-89637f88b8f2"

print("🔍 DIAGNÓSTICO COMPLETO DO PROBLEMA 403")
print("=" * 60)

# 1. Login e obter token
print("\n1️⃣ OBTENDO TOKEN FRESCO...")
login_data = {"username": "admin@admin.com", "password": "admin"}
response = requests.post(f"{base_url}/api/v1/auth/login", json=login_data)

if response.status_code != 200:
    print(f"❌ Falha no login: {response.status_code}")
    exit(1)

token = response.json()["access_token"]
print(f"✅ Token obtido: {token[:50]}...")

# 2. Testar headers exatos como o frontend deveria enviar
print("\n2️⃣ TESTANDO HEADERS COMO FRONTEND...")
headers = {
    "Authorization": f"Bearer {token}",
    "Content-Type": "application/json",
    "Origin": "http://localhost:3000",
    "Referer": "http://localhost:3000/",
    "User-Agent": "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36"
}

response = requests.get(f"{base_url}/api/projects/{project_id}", headers=headers)
print(f"📡 Status: {response.status_code}")
print(f"📋 Headers enviados: {dict(headers)}")

if response.status_code == 200:
    print("✅ Sucesso com headers completos!")
    data = response.json()
    print(f"📄 Projeto: {data['name']}")
else:
    print(f"❌ Falha: {response.status_code} - {response.text}")

# 3. Testar só com Authorization
print("\n3️⃣ TESTANDO SÓ COM AUTHORIZATION...")
simple_headers = {"Authorization": f"Bearer {token}"}

response = requests.get(f"{base_url}/api/projects/{project_id}", headers=simple_headers)
print(f"📡 Status: {response.status_code}")
if response.status_code == 200:
    print("✅ Sucesso com headers mínimos!")
else:
    print(f"❌ Falha: {response.status_code} - {response.text}")

# 4. Testar endpoint de debug do backend
print("\n4️⃣ TESTANDO DEBUG DE TOKEN...")
response = requests.get(f"{base_url}/api/debug/token", headers=simple_headers)
if response.status_code == 200:
    debug = response.json()
    print(f"✅ Token válido: {debug.get('valid')}")
    print(f"📋 User ID no token: {debug.get('payload')}")
else:
    print(f"❌ Debug falhou: {response.status_code}")

# 5. Verificar dados do usuário
print("\n5️⃣ VERIFICANDO DADOS DO USUÁRIO...")
response = requests.get(f"{base_url}/api/v1/auth/me", headers=simple_headers)
if response.status_code == 200:
    user = response.json()
    print(f"✅ Usuário: {user['email']} (ID: {user['id']})")
    print(f"📋 Admin: {user.get('is_admin')}")
else:
    print(f"❌ Falha ao buscar usuário: {response.status_code}")

# 6. Listar projetos primeiro
print("\n6️⃣ TESTANDO LISTA DE PROJETOS...")
response = requests.get(f"{base_url}/api/projects", headers=simple_headers)
print(f"📡 Status lista: {response.status_code}")
if response.status_code == 200:
    projects = response.json()
    print(f"✅ {len(projects)} projetos encontrados")
    for p in projects:
        print(f"   - {p['name']} (ID: {p['id']}, Owner: {p.get('owner_id')})")
else:
    print(f"❌ Falha na lista: {response.status_code} - {response.text}")

# 7. Testar diferentes variações do endpoint
print("\n7️⃣ TESTANDO VARIAÇÕES DO ENDPOINT...")
endpoints_to_test = [
    f"/api/projects/{project_id}",
    f"/api/v1/projects/{project_id}",
    f"/api/projects/{project_id}/",
]

for endpoint in endpoints_to_test:
    response = requests.get(f"{base_url}{endpoint}", headers=simple_headers)
    print(f"📡 {endpoint}: {response.status_code}")

print("\n" + "=" * 60)
print("🔍 DIAGNÓSTICO CONCLUÍDO!")

# 8. Comando para frontend
print(f"\n8️⃣ COMANDO PARA FRONTEND (se token for o problema):")
print(f"""
localStorage.setItem('token', '{token}');
localStorage.setItem('user', '{json.dumps({"id": "bf14e64c-5c83-4066-8844-18aaf6bd9b3a", "name": "admin@admin.com", "email": "admin@admin.com", "role": "admin"})}');
location.reload();
""") 