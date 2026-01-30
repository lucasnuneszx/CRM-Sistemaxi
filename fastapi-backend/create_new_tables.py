#!/usr/bin/env python3
"""
Script para criar as novas tabelas no banco de dados:
- leads
- kanban_columns
- clientes
- propostas
"""

import sys
from pathlib import Path

# Add the app directory to the path
sys.path.insert(0, str(Path(__file__).parent))

from app.core.database import engine, Base
from app.models import Lead, KanbanColumn, Cliente, Proposta

def create_tables():
    """Create all new tables"""
    print("Creating new tables...")
    print("- leads")
    print("- kanban_columns")
    print("- clientes")
    print("- propostas")
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    
    print("\n✅ Tables created successfully!")

if __name__ == "__main__":
    create_tables()

