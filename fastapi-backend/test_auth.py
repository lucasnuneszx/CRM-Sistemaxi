#!/usr/bin/env python3

import requests
import json

# Test authentication and project access
base_url = "http://localhost:3001"

def test_login():
    """Test login and get token"""
    login_data = {
        "username": "admin@admin.com",
        "password": "admin"
    }
    
    print("🔐 Testing login...")
    response = requests.post(f"{base_url}/api/v1/auth/login", json=login_data)
    
    if response.status_code == 200:
        token_data = response.json()
        access_token = token_data.get("access_token")
        print(f"✅ Login successful! Token: {access_token[:50]}...")
        return access_token
    else:
        print(f"❌ Login failed: {response.status_code} - {response.text}")
        return None

def test_projects_list(token):
    """Test projects list"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print("\n📋 Testing projects list...")
    response = requests.get(f"{base_url}/api/projects", headers=headers)
    
    if response.status_code == 200:
        projects = response.json()
        print(f"✅ Projects list successful! Found {len(projects)} projects")
        for project in projects:
            print(f"   - {project['name']} (ID: {project['id']})")
        return projects
    else:
        print(f"❌ Projects list failed: {response.status_code} - {response.text}")
        return []

def test_project_detail(token, project_id):
    """Test specific project access"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🎯 Testing project detail for {project_id}...")
    response = requests.get(f"{base_url}/api/projects/{project_id}", headers=headers)
    
    if response.status_code == 200:
        project = response.json()
        print(f"✅ Project detail successful! Project: {project['name']}")
        return project
    else:
        print(f"❌ Project detail failed: {response.status_code} - {response.text}")
        print(f"   Response headers: {dict(response.headers)}")
        return None

def test_token_debug(token):
    """Test token validation"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🐛 Testing token debug...")
    response = requests.get(f"{base_url}/api/debug/token", headers=headers)
    
    if response.status_code == 200:
        debug_info = response.json()
        print(f"✅ Token debug successful!")
        print(f"   Valid: {debug_info.get('valid')}")
        if debug_info.get('payload'):
            payload = debug_info['payload']
            if isinstance(payload, dict):
                print(f"   User ID: {payload.get('sub')}")
            else:
                print(f"   Payload: {payload}")
        return debug_info
    else:
        print(f"❌ Token debug failed: {response.status_code} - {response.text}")
        return None

def test_multiple_attempts(token, project_id, attempts=5):
    """Test multiple attempts to access project"""
    headers = {"Authorization": f"Bearer {token}"}
    
    print(f"\n🔄 Testing {attempts} attempts to access project {project_id}...")
    success_count = 0
    
    for i in range(attempts):
        response = requests.get(f"{base_url}/api/projects/{project_id}", headers=headers)
        if response.status_code == 200:
            success_count += 1
            print(f"   Attempt {i+1}: ✅ SUCCESS")
        else:
            print(f"   Attempt {i+1}: ❌ FAILED ({response.status_code})")
    
    print(f"\n📊 Results: {success_count}/{attempts} successful")
    return success_count == attempts

if __name__ == "__main__":
    print("🚀 Starting authentication tests...\n")
    
    # Login
    token = test_login()
    if not token:
        exit(1)
    
    # Test token
    test_token_debug(token)
    
    # Test projects list
    projects = test_projects_list(token)
    
    # Test specific project if we found any
    if projects:
        project_id = "7f5241c7-15d3-4aac-bf66-89637f88b8f2"
        test_project_detail(token, project_id)
        
        # Test multiple attempts to see if it's intermittent
        test_multiple_attempts(token, project_id, 10)
    
    print("\n✅ Tests completed!") 