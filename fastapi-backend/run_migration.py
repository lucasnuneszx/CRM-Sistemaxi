#!/usr/bin/env python3

import psycopg2
import os
from dotenv import load_dotenv

load_dotenv('config.env')

def run_migration():
    # Parse DATABASE_URL for PostgreSQL
    database_url = os.getenv('DATABASE_URL')
    
    if database_url.startswith('postgresql://'):
        # Use PostgreSQL
        try:
            conn = psycopg2.connect(database_url)
            cursor = conn.cursor()
            
            # Read and execute migration
            with open('migrations/add_user_projects.sql', 'r') as f:
                migration_sql = f.read()
            
            cursor.execute(migration_sql)
            conn.commit()
            print('✅ PostgreSQL Migration executed successfully!')
            
        except Exception as e:
            print(f'❌ PostgreSQL Migration failed: {e}')
            if 'conn' in locals():
                conn.rollback()
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()
    
    else:
        # Use SQLite for development
        import sqlite3
        try:
            conn = sqlite3.connect('./squad.db')
            cursor = conn.cursor()
            
            # SQLite version of migration
            sqlite_migration = """
-- Create user_projects table for SQLite
CREATE TABLE IF NOT EXISTS user_projects (
    id TEXT PRIMARY KEY DEFAULT (lower(hex(randomblob(16)))),
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role TEXT NOT NULL DEFAULT 'creative_user' CHECK (role IN ('project_manager', 'creative_user')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE(user_id, project_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX IF NOT EXISTS idx_user_projects_role ON user_projects(role);

-- Create trigger for updated_at
CREATE TRIGGER IF NOT EXISTS update_user_projects_updated_at 
    AFTER UPDATE ON user_projects 
    FOR EACH ROW 
    BEGIN
        UPDATE user_projects SET updated_at = CURRENT_TIMESTAMP WHERE id = NEW.id;
    END;
            """
            
            cursor.executescript(sqlite_migration)
            conn.commit()
            print('✅ SQLite Migration executed successfully!')
            
        except Exception as e:
            print(f'❌ SQLite Migration failed: {e}')
            if 'conn' in locals():
                conn.rollback()
        finally:
            if 'cursor' in locals():
                cursor.close()
            if 'conn' in locals():
                conn.close()

if __name__ == "__main__":
    run_migration()