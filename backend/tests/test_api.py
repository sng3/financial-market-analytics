from __future__ import annotations


def signup_user(client, **overrides):
    payload = {
        'firstName': 'ShiQing',
        'lastName': 'Ng',
        'email': 'shiqing@example.com',
        'phone': '4195551234',
        'password': 'Password123',
    }
    payload.update(overrides)
    response = client.post('/api/signup', json=payload)
    return response


def create_user_and_get_id(client, **overrides) -> int:
    response = signup_user(client, **overrides)
    assert response.status_code == 201
    return response.get_json()['user']['id']


def get_main_watchlist_id(client, user_id: int) -> int:
    response = client.get(f'/api/users/{user_id}/watchlists')
    assert response.status_code == 200
    watchlists = response.get_json()['watchlists']
    assert len(watchlists) >= 1
    return watchlists[0]['id']


def test_health_route_returns_ok(client):
    response = client.get('/api/health')

    assert response.status_code == 200
    assert response.get_json() == {'status': 'ok'}


def test_signup_creates_user_and_default_watchlist(client):
    response = signup_user(client)
    body = response.get_json()

    assert response.status_code == 201
    assert body['ok'] is True
    assert body['user']['email'] == 'shiqing@example.com'
    assert body['user']['riskTolerance'] == 'Moderate'

    user_id = body['user']['id']
    watchlists_response = client.get(f'/api/users/{user_id}/watchlists')
    watchlists_body = watchlists_response.get_json()

    assert watchlists_response.status_code == 200
    assert len(watchlists_body['watchlists']) == 1
    assert watchlists_body['watchlists'][0]['name'] == 'Main'


def test_signup_rejects_duplicate_email(client):
    first = signup_user(client)
    second = signup_user(client)

    assert first.status_code == 201
    assert second.status_code == 409
    assert second.get_json()['error'] == 'An account with this email already exists'


def test_login_succeeds_with_correct_password(client):
    signup_user(client)

    response = client.post(
        '/api/login',
        json={'email': 'shiqing@example.com', 'password': 'Password123'},
    )

    assert response.status_code == 200
    assert response.get_json()['ok'] is True


def test_login_rejects_wrong_password(client):
    signup_user(client)

    response = client.post(
        '/api/login',
        json={'email': 'shiqing@example.com', 'password': 'wrong-password'},
    )

    assert response.status_code == 401
    assert response.get_json()['error'] == 'Invalid email or password'


def test_update_profile_rejects_alert_types_without_delivery_method(client):
    user_id = create_user_and_get_id(client)

    response = client.put(
        f'/api/profile/{user_id}',
        json={
            'firstName': 'ShiQing',
            'lastName': 'Ng',
            'email': 'shiqing@example.com',
            'phone': '4195551234',
            'riskTolerance': 'Moderate',
            'experience': 'Beginner',
            'goal': 'Learning',
            'horizon': '1 - 5 Years',
            'favoriteSectors': ['Technology'],
            'country': 'United States',
            'timeZone': 'America/New_York',
            'notifications': {
                'emailAlerts': False,
                'priceAlerts': True,
                'newsAlerts': True,
                'smsNotifications': False,
                'pushNotifications': False,
            },
        },
    )

    assert response.status_code == 400
    assert 'At least one delivery method' in response.get_json()['error']


def test_update_profile_persists_profile_fields(client):
    user_id = create_user_and_get_id(client)

    update_response = client.put(
        f'/api/profile/{user_id}',
        json={
            'firstName': 'ShiQing',
            'lastName': 'Ng',
            'email': 'newmail@example.com',
            'phone': '5678901234',
            'riskTolerance': 'Aggressive',
            'experience': 'Intermediate',
            'goal': 'Short Term Trading',
            'horizon': '< 1 Year',
            'favoriteSectors': ['Technology', 'Energy'],
            'country': 'United States',
            'timeZone': 'America/Chicago',
            'notifications': {
                'emailAlerts': True,
                'priceAlerts': True,
                'newsAlerts': False,
                'smsNotifications': True,
                'pushNotifications': False,
            },
        },
    )
    profile_response = client.get(f'/api/profile/{user_id}')

    assert update_response.status_code == 200
    profile = profile_response.get_json()['user']
    assert profile['email'] == 'newmail@example.com'
    assert profile['riskTolerance'] == 'Aggressive'
    assert profile['favoriteSectors'] == ['Technology', 'Energy']
    assert profile['timeZone'] == 'America/Chicago'
    assert profile['notifications']['smsNotifications'] is True
    assert profile['notifications']['newsAlerts'] is False


def test_add_duplicate_ticker_returns_existing_message(client):
    user_id = create_user_and_get_id(client)
    watchlist_id = get_main_watchlist_id(client, user_id)

    first = client.post(f'/api/watchlists/{watchlist_id}/tickers', json={'ticker': 'aapl'})
    second = client.post(f'/api/watchlists/{watchlist_id}/tickers', json={'ticker': 'AAPL'})
    tickers = client.get(f'/api/watchlists/{watchlist_id}/tickers')

    assert first.status_code == 201
    assert second.status_code == 200
    assert second.get_json()['ok'] is False
    assert second.get_json()['message'] == 'Ticker already exists in watchlist'
    assert tickers.get_json()['tickers'] == ['AAPL']


def test_create_alert_fails_when_price_alerts_are_disabled(client):
    user_id = create_user_and_get_id(client)

    update_response = client.put(
        f'/api/profile/{user_id}',
        json={
            'firstName': 'ShiQing',
            'lastName': 'Ng',
            'email': 'shiqing@example.com',
            'phone': '4195551234',
            'riskTolerance': 'Moderate',
            'experience': 'Beginner',
            'goal': 'Learning',
            'horizon': '1 - 5 Years',
            'favoriteSectors': [],
            'country': 'United States',
            'timeZone': 'America/New_York',
            'notifications': {
                'emailAlerts': True,
                'priceAlerts': False,
                'newsAlerts': False,
                'smsNotifications': False,
                'pushNotifications': False,
            },
        },
    )
    assert update_response.status_code == 200

    response = client.post(
        f'/api/users/{user_id}/alerts',
        json={'ticker': 'AAPL', 'condition': 'Above', 'price': 250},
    )

    assert response.status_code == 403
    assert response.get_json()['error'] == 'Price alerts are disabled in your profile settings.'


def test_create_and_delete_alert(client):
    user_id = create_user_and_get_id(client)

    create_response = client.post(
        f'/api/users/{user_id}/alerts',
        json={'ticker': 'MSFT', 'condition': 'Above', 'price': 500},
    )

    assert create_response.status_code == 201
    create_body = create_response.get_json()
    assert create_body['ok'] is True
    assert create_body['alert']['ticker'] == 'MSFT'

    alert_id = create_body['alert']['id']
    delete_response = client.delete(f'/api/alerts/{alert_id}')

    assert delete_response.status_code == 200
    assert delete_response.get_json()['deleted'] == 1


def test_check_alerts_route_can_be_mocked(client, monkeypatch):
    def fake_check_user_price_alerts(user_id):
        return {
            'ok': True,
            'userId': user_id,
            'alertsChecked': 2,
            'alertsTriggered': 1,
            'triggeredAlerts': [{'ticker': 'AAPL'}],
        }

    monkeypatch.setattr(
        'app.routes.alerts.check_user_price_alerts',
        fake_check_user_price_alerts,
    )

    response = client.post('/api/users/999/alerts/check')

    assert response.status_code == 200
    assert response.get_json()['alertsTriggered'] == 1


def test_stock_endpoint_with_mocked_quote_and_cache(client, monkeypatch):
    monkeypatch.setattr('app.routes.stocks.cache_get', lambda key: None)
    monkeypatch.setattr('app.routes.stocks.cache_set', lambda *args, **kwargs: None)
    monkeypatch.setattr(
        'app.routes.stocks.get_quote',
        lambda ticker: {
            'ticker': ticker,
            'name': 'Apple Inc.',
            'price': 210.5,
            'prevClose': 208.0,
            'change': 2.5,
            'changePct': 1.2,
            'updatedAt': '2026-04-20T12:00:00Z',
            'marketStatus': 'Open',
            'extendedLabel': None,
            'extendedPrice': None,
            'extendedChange': None,
            'extendedChangePct': None,
            'extendedUpdatedAt': None,
            'atCloseUpdatedAt': None,
        },
    )

    response = client.get('/api/stock?ticker=AAPL')

    assert response.status_code == 200
    assert response.get_json()['ticker'] == 'AAPL'
    assert response.get_json()['name'] == 'Apple Inc.'
