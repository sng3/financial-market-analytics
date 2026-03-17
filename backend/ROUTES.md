# Backend Route Responsibilities

## Main backend entry file
The main backend starts from `backend/run.py`.

This file:
- creates the Flask app
- turns on CORS for the API
- registers the route files
- initializes the database
- includes the `/api/health` route

This should be the main file used to run the backend.

---

## Stock-related routes
These are in `backend/app/routes/stocks.py`.

### `/api/search`
Used to search for stock tickers based on what the user types in.

It uses:
- `search_tickers()` from `backend/app/services/market_data.py`

Right now this search is still pretty basic.

### `/api/stock`
Used to return stock quote data for one ticker.

It uses:
- `get_quote()` from `backend/app/services/market_data.py`

This route is cached for 30 seconds so repeated refreshes do not keep hitting the external API every time.

### `/api/sentiment`
Used to return sentiment / news-related information for a ticker.

It uses:
- `get_sentiment()` from `backend/app/services/sentiment_service.py`

This route is cached for 600 seconds because sentiment does not need to update as often as stock price data.

### `/api/indicator_series`
Used to return technical indicator data like SMA and RSI.

It uses:
- `build_indicator_series()` from `backend/app/services/indicators_service.py`

This route is cached for 300 seconds.

### `/api/debug_tables`
This is just a debug route for checking what database tables currently exist.

This should probably stay as a development-only route.

---

## Watchlist routes
These are in `backend/app/routes/watchlists.py`.

### `/api/users/<user_id>/watchlists`
Returns the watchlists for a user.

### `/api/watchlists/<watchlist_id>/tickers`
Returns the tickers inside a watchlist.

### `POST /api/watchlists/<watchlist_id>/tickers`
Adds a ticker to a watchlist.

### `DELETE /api/watchlists/<watchlist_id>/tickers/<ticker>`
Removes a ticker from a watchlist.

These routes deal with saved user data, so they should probably be protected later once login/authentication is added.

---

## Service files
The service files handle most of the actual logic.

### `backend/app/services/market_data.py`
Handles:
- stock search
- stock quote data
- historical data
- some indicator calculations

### `backend/app/services/indicators_service.py`
Handles:
- technical indicator series

### `backend/app/services/sentiment_service.py`
Handles:
- sentiment data
- NewsAPI usage
- yfinance fallback
- filtering relevant articles

### `backend/app/services/cache.py`
Handles:
- SQLite cache reads/writes
- TTL-based caching

---

## Redundant / legacy backend file
There is also a `backend/app.py` file.