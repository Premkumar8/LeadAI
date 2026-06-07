from fastapi import status

def test_company_and_lead_crud(client):
    # Log in to get auth token
    login_response = client.post(
        "/api/v1/auth/login",
        data={
            "username": "test@example.com",
            "password": "testpassword123"
        }
    )
    token = login_response.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}
    
    # 1. Create a Company
    company_res = client.post(
        "/api/v1/companies/",
        json={
            "company_name": "Test Company Corp",
            "website": "testcorp.com",
            "industry": "DevTools",
            "country": "Germany",
            "employee_count": 50
        },
        headers=headers
    )
    assert company_res.status_code == status.HTTP_200_OK
    company_id = company_res.json()["id"]
    
    # 2. Create a Lead linked to Company
    lead_res = client.post(
        "/api/v1/leads/",
        json={
            "company_id": company_id,
            "status": "New",
            "priority": "Medium",
            "estimated_value": 50000.0,
            "source": "Website"
        },
        headers=headers
    )
    assert lead_res.status_code == status.HTTP_200_OK
    lead_id = lead_res.json()["id"]
    
    # 3. Read Lead
    get_lead_res = client.get(f"/api/v1/leads/{lead_id}", headers=headers)
    assert get_lead_res.status_code == status.HTTP_200_OK
    assert get_lead_res.json()["estimated_value"] == 50000.0
    
    # 4. Check Dashboard stats
    dash_res = client.get("/api/v1/analytics/dashboard", headers=headers)
    assert dash_res.status_code == status.HTTP_200_OK
    dash_data = dash_res.json()
    assert dash_data["total_leads"] == 1
    assert dash_data["pipeline_value"] == 50000.0
