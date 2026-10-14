import pytest
from unittest.mock import patch

@pytest.mark.asyncio
async def test_health_live(client):
    res = await client.get("/health/live")
    assert res.status_code == 200
    assert res.json()["status"] == "alive"

@pytest.mark.asyncio
async def test_health_ready(client):
    res = await client.get("/health/ready")
    assert res.status_code == 200
    data = res.json()
    assert data["status"] == "ready"
    assert data["tts_engine"]["ready"] is True

@pytest.mark.asyncio
async def test_auth_register_and_login(client):
    # Registration
    email = "newuser_antigravity@manavoice.ai"
    reg_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "SecurePassword123", "display_name": "New Antigravity User"},
    )
    assert reg_res.status_code == 201
    reg_data = reg_res.json()
    assert "access_token" in reg_data
    assert "refresh_token" in reg_data

    # Duplicate registration should return 409 Conflict
    dup_res = await client.post(
        "/api/v1/auth/register",
        json={"email": email, "password": "SecurePassword123", "display_name": "Duplicate User"},
    )
    assert dup_res.status_code == 409

    # Successful login
    login_res = await client.post(
        "/api/v1/auth/login",
        json={"email": email, "password": "SecurePassword123"},
    )
    assert login_res.status_code == 200
    token = login_res.json()["access_token"]

    # Current user me
    me_res = await client.get("/api/v1/auth/me", headers={"Authorization": f"Bearer {token}"})
    assert me_res.status_code == 200
    assert me_res.json()["email"] == email

@pytest.mark.asyncio
async def test_auth_invalid_credentials(client):
    res = await client.post(
        "/api/v1/auth/login",
        json={"email": "nonexistent@manavoice.ai", "password": "WrongPassword"},
    )
    assert res.status_code == 401

@pytest.mark.asyncio
async def test_languages_catalog(client):
    res = await client.get("/api/v1/languages")
    assert res.status_code == 200
    langs = res.json()
    assert len(langs) >= 5
    codes = [l["code"] for l in langs]
    assert "en" in codes
    assert "es" in codes
    assert "fr" in codes

@pytest.mark.asyncio
async def test_translation(client, auth_headers):
    # Same language passthrough
    pass_res = await client.post(
        "/api/v1/speech/translate",
        json={"text": "Hello world", "source_language": "en", "target_language": "en"},
        headers=auth_headers,
    )
    assert pass_res.status_code == 200
    assert pass_res.json()["translated_text"] == "Hello world"
    assert pass_res.json()["provider"] == "passthrough"

    # Cross-language translation
    trans_res = await client.post(
        "/api/v1/speech/translate",
        json={"text": "hello", "source_language": "en", "target_language": "es"},
        headers=auth_headers,
    )
    assert trans_res.status_code == 200
    assert trans_res.json()["source_language"] == "en"
    assert trans_res.json()["target_language"] == "es"

@pytest.mark.asyncio
async def test_speech_generation_and_storage(client, auth_headers):
    # Fast mock for audio generation in unit test
    with patch("app.services.tts_service.tts_engine.generate_speech") as mock_gen:
        mock_gen.return_value = ("test_audio_key_1.wav", 3.5, 16000, 112000)

        gen_res = await client.post(
            "/api/v1/speech/generate",
            json={
                "original_text": "Testing speech synthesis.",
                "source_language": "en",
                "target_language": "en",
            },
            headers=auth_headers,
        )
        assert gen_res.status_code == 201
        data = gen_res.json()
        assert data["status"] == "completed"
        assert data["duration_seconds"] == 3.5
        assert data["sample_rate"] == 16000
        gen_id = data["id"]

        # Get details
        detail_res = await client.get(f"/api/v1/speech/{gen_id}", headers=auth_headers)
        assert detail_res.status_code == 200
        assert detail_res.json()["id"] == gen_id

@pytest.mark.asyncio
async def test_unsupported_language_fails(client, auth_headers):
    res = await client.post(
        "/api/v1/speech/generate",
        json={
            "original_text": "Testing invalid language.",
            "source_language": "en",
            "target_language": "klingon",
        },
        headers=auth_headers,
    )
    assert res.status_code == 400

@pytest.mark.asyncio
async def test_history_and_pagination(client, auth_headers):
    res = await client.get("/api/v1/history?page=1&page_size=10", headers=auth_headers)
    assert res.status_code == 200
    data = res.json()
    assert "items" in data
    assert "total" in data
    assert "page" in data

@pytest.mark.asyncio
async def test_dashboard_and_analytics(client, auth_headers):
    # Summary
    summary_res = await client.get("/api/v1/dashboard/summary", headers=auth_headers)
    assert summary_res.status_code == 200
    sum_data = summary_res.json()
    assert "total_generations" in sum_data
    assert "successful_generations" in sum_data
    assert "total_audio_duration_seconds" in sum_data
    assert "characters_processed" in sum_data
    assert "languages_used" in sum_data
    assert "success_rate_pct" in sum_data

    # Activity chart
    act_res = await client.get("/api/v1/dashboard/activity?days=30", headers=auth_headers)
    assert act_res.status_code == 200
    assert isinstance(act_res.json(), list)

    # Language distribution
    lang_res = await client.get("/api/v1/dashboard/language-distribution", headers=auth_headers)
    assert lang_res.status_code == 200

    # Analytics overview
    analytics_res = await client.get("/api/v1/analytics/overview?days=30", headers=auth_headers)
    assert analytics_res.status_code == 200
    an_data = analytics_res.json()
    assert "daily_trends" in an_data
    assert "language_usage" in an_data

@pytest.mark.asyncio
async def test_saved_audio_workflow(client, auth_headers):
    with patch("app.services.tts_service.tts_engine.generate_speech") as mock_gen:
        mock_gen.return_value = ("saved_audio_key.wav", 2.0, 16000, 64000)
        gen_res = await client.post(
            "/api/v1/speech/generate",
            json={"original_text": "Bookmark me", "source_language": "en", "target_language": "en"},
            headers=auth_headers,
        )
        gen_id = gen_res.json()["id"]

        # Bookmark
        save_res = await client.post(f"/api/v1/saved-audio/{gen_id}", headers=auth_headers)
        assert save_res.status_code == 201

        # List saved
        list_res = await client.get("/api/v1/saved-audio", headers=auth_headers)
        assert list_res.status_code == 200
        saved_items = list_res.json()
        assert any(item["id"] == gen_id for item in saved_items)

        # Unsave
        unsave_res = await client.delete(f"/api/v1/saved-audio/{gen_id}", headers=auth_headers)
        assert unsave_res.status_code == 200

@pytest.mark.asyncio
async def test_user_data_isolation(client, auth_headers, second_auth_headers):
    # User 1 creates generation
    with patch("app.services.tts_service.tts_engine.generate_speech") as mock_gen:
        mock_gen.return_value = ("isolated_key.wav", 1.5, 16000, 48000)
        gen_res = await client.post(
            "/api/v1/speech/generate",
            json={"original_text": "Private User 1 Text", "source_language": "en", "target_language": "en"},
            headers=auth_headers,
        )
        gen_id = gen_res.json()["id"]

        # User 2 attempts to get User 1's generation details -> 404
        u2_detail = await client.get(f"/api/v1/speech/{gen_id}", headers=second_auth_headers)
        assert u2_detail.status_code == 404

        # User 2 attempts to delete User 1's generation -> 404
        u2_del = await client.delete(f"/api/v1/speech/{gen_id}", headers=second_auth_headers)
        assert u2_del.status_code == 404

        # User 1 can delete their own generation -> 200
        u1_del = await client.delete(f"/api/v1/speech/{gen_id}", headers=auth_headers)
        assert u1_del.status_code == 200

@pytest.mark.asyncio
async def test_generation_deletion(client, auth_headers):
    with patch("app.services.tts_service.tts_engine.generate_speech") as mock_gen:
        mock_gen.return_value = ("delete_test_key.wav", 1.0, 16000, 32000)
        gen_res = await client.post(
            "/api/v1/speech/generate",
            json={"original_text": "To be deleted", "source_language": "en", "target_language": "en"},
            headers=auth_headers,
        )
        gen_id = gen_res.json()["id"]

        # Delete it via history endpoint
        del_res = await client.delete(f"/api/v1/history/{gen_id}", headers=auth_headers)
        assert del_res.status_code == 200

        # Verify it no longer exists
        get_res = await client.get(f"/api/v1/history/{gen_id}", headers=auth_headers)
        assert get_res.status_code == 404
