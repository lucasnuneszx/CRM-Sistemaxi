#!/usr/bin/env python3
"""Script para testar leitura de variáveis de ambiente"""
import os

print("=" * 60)
print("🔍 TESTE DE VARIÁVEIS DE AMBIENTE")
print("=" * 60)

# Testar DATABASE_URL
db_url = os.getenv("DATABASE_URL")
if db_url:
    print(f"✅ DATABASE_URL encontrada: {db_url[:50]}...")
    if db_url.startswith('='):
        print("⚠️  ATENÇÃO: DATABASE_URL começa com '=' - precisa limpar!")
    if 'postgresql' in db_url.lower():
        print("✅ Tipo: PostgreSQL")
    elif 'sqlite' in db_url.lower():
        print("⚠️  Tipo: SQLite (não é o esperado para Railway)")
else:
    print("❌ DATABASE_URL NÃO encontrada no ambiente!")

# Testar outras variáveis importantes
print("\n📋 Outras variáveis:")
for var in ["PORT", "ENVIRONMENT", "JWT_SECRET_KEY", "RAILWAY_PUBLIC_DOMAIN"]:
    value = os.getenv(var)
    if value:
        print(f"  ✅ {var}: {value[:30] if len(value) > 30 else value}...")
    else:
        print(f"  ⚠️  {var}: não definida")

print("\n" + "=" * 60)

