# Security and Stability Notes

## Current backend situation
Right now the backend has public API routes for:
- stock search
- stock quote data
- sentiment
- technical indicators
- watchlists

This is okay for development, but not everything should stay public forever.

---

## Routes that are probably fine to stay public
These are mostly read-only and used to load market information on the dashboard:

- `/api/health`
- `/api/search`
- `/api/stock`
- `/api/sentiment`
- `/api/indicator_series`

These make sense as public routes for now because they are just returning stock-related information.

---

## Routes that should probably require login later
These routes deal with saved or user-related data:

- `/api/users/<user_id>/watchlists`
- `/api/watchlists/<watchlist_id>/tickers`
- `POST /api/watchlists/<watchlist_id>/tickers`
- `DELETE /api/watchlists/<watchlist_id>/tickers/<ticker>`

These should probably be protected once login/authentication is added, because users should not be able to view or modify another user’s watchlists just by knowing an id.

---

## Stability / rate-limit notes
The backend already has some protection against repeated API usage because it uses SQLite-based caching.

Current cache TTL values:
- stock quote: 30 seconds
- sentiment: 600 seconds
- indicator series: 300 seconds

This helps reduce repeated external API requests when the dashboard refreshes multiple times.

For future stability, the backend should also have:
- per-IP or per-user rate limiting
- better request logging
- better handling for external API failures and retry behavior

---

## CORS notes
The backend currently allows broad CORS access for `/api/*`.

That is fine for local development, but in production it should be limited to the real frontend domain instead of allowing everything.

---

## Secret / API key handling
Any external API keys should stay in environment variables and should not be hardcoded into the repo.

This already matters for:
- `NEWS_API_KEY`

That should continue to be handled through `.env` or environment configuration only.

---

## Redundant backend file risk
There is both:
- `backend/run.py`
- `backend/app.py`

From what I found, `backend/run.py` is the real backend entry point and the project now uses route files and service files.

Because of that, `backend/app.py` looks like older/duplicate backend code.

That is a stability risk because people could:
- edit the wrong file
- run the wrong backend
- create route conflicts

So the team should avoid adding new work there and eventually clean it up.

---

## Future login gating recommendation
When authentication is added later, the best first step would be to protect:
- watchlist routes
- any future alert-saving routes
- any future user-specific profile routes

The stock information routes can stay public longer, but write routes and user-specific routes should be protected first.
