-- Migration: Add user_projects table for role-based project access
-- Date: 2024-01-XX

-- Create enum for project roles
CREATE TYPE project_role AS ENUM ('project_manager', 'creative_user');

-- Create user_projects table
CREATE TABLE user_projects (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    project_id UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
    role project_role NOT NULL DEFAULT 'creative_user',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique user-project combination
    UNIQUE(user_id, project_id)
);

-- Create indexes for better performance
CREATE INDEX idx_user_projects_user_id ON user_projects(user_id);
CREATE INDEX idx_user_projects_project_id ON user_projects(project_id);
CREATE INDEX idx_user_projects_role ON user_projects(role);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_user_projects_updated_at 
    BEFORE UPDATE ON user_projects 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column(); 