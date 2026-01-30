#!/usr/bin/env python3

import requests
import json

# Get token and user data for frontend localStorage
base_url = "http://localhost:3001"

# Login to get token
login_data = {
    "username": "admin@admin.com",
    "password": "admin"
}

print("🔐 Fazendo login...")
response = requests.post(f"{base_url}/api/v1/auth/login", json=login_data)

if response.status_code == 200:
    token_data = response.json()
    access_token = token_data.get("access_token")
    print(f"✅ Login successful!")
    
    # Get user data
    headers = {"Authorization": f"Bearer {access_token}"}
    user_response = requests.get(f"{base_url}/api/v1/auth/me", headers=headers)
    
    if user_response.status_code == 200:
        user_data = user_response.json()
        print(f"✅ User data retrieved!")
        
        # Create frontend user object
        frontend_user = {
            "id": user_data["id"],
            "name": user_data.get("username", "Administrador"),
            "email": user_data["email"],
            "role": "admin" if user_data.get("is_admin") else "user"
        }
        
        print("\n🔧 FRONTEND LOCALSTORAGE UPDATE:")
        print("Execute this in your browser console:")
        print(f"""
localStorage.setItem('token', '{access_token}');
localStorage.setItem('user', '{json.dumps(frontend_user)}');
location.reload();
""")
        
        print(f"\n📋 USER DATA:")
        print(f"   ID: {frontend_user['id']}")
        print(f"   Name: {frontend_user['name']}")
        print(f"   Email: {frontend_user['email']}")
        print(f"   Role: {frontend_user['role']}")
        
    else:
        print(f"❌ Failed to get user data: {user_response.status_code}")
        
else:
    print(f"❌ Login failed: {response.status_code}") 