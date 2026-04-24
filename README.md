# Financial Market Analytics Web Application

![React](https://img.shields.io/badge/Frontend-React%2019-61DAFB?logo=react&logoColor=white)
![TypeScript](https://img.shields.io/badge/Language-TypeScript-3178C6?logo=typescript&logoColor=white)
![Vite](https://img.shields.io/badge/Build-Vite-646CFF?logo=vite&logoColor=white)
![Flask](https://img.shields.io/badge/Backend-Flask-000000?logo=flask&logoColor=white)
![SQLite](https://img.shields.io/badge/Database-SQLite-003B57?logo=sqlite&logoColor=white)
![License](https://img.shields.io/badge/License-Educational-blue)

A full-stack financial analytics dashboard that combines real-time stock data, historical charts, technical indicators, sentiment analysis, machine learning predictions, personalization, watchlists, alerts, and export tools in a single web application.

## Overview

Financial market information is often fragmented across separate charting platforms, news feeds, and analytics tools. This project brings those pieces into one interactive dashboard designed to help beginner investors and students explore market behavior more efficiently.

The application supports:
- real-time stock lookup
- historical price visualization
- SMA and RSI technical indicators
- financial news sentiment analysis
- Random Forest based trend prediction
- personalized stock recommendations
- watchlists and alerts
- PDF and Excel export

> Educational use only. This project is not financial advice.

## Key Features

### Market data dashboard
- Search by ticker symbol or company name
- View current price, previous close, daily change, and market status
- Explore historical price movement across selectable ranges such as 1D, 5D, 1M, 6M, 1Y, and MAX

### Technical analysis
- SMA20 and SMA50 overlays
- RSI14 calculation and interpretation
- Indicator summary cards for faster reading

### Sentiment analysis
- Retrieves stock-related financial news
- Uses VADER sentiment scoring
- Aggregates article-level sentiment into an overall market sentiment label
- Includes provider health and fallback behavior when news data is limited

### AI/ML prediction
- Random Forest based short-term trend prediction
- Confidence score, explanation, interpretation, and suggested action
- Risk-profile-aware output for Conservative, Moderate, and Aggressive users

### Personalization
- User onboarding and profile management
- Risk tolerance, experience, goal, horizon, favorite sectors, country, and time zone preferences
- Personalized recommendation feed based on saved preferences

### Watchlists and alerts
- Create and manage a user watchlist
- Configure price alerts
- Email notification support through SMTP configuration
- News alert tracking support in the backend

### Export tools
- Export dashboard summaries as PDF
- Export structured analytics data as Excel

## Tech Stack

### Frontend
- React 19
- TypeScript
- Vite
- React Router
- Axios
- Chart.js + react-chartjs-2
- ExcelJS
- jsPDF
- html2canvas
- file-saver

### Backend
- Flask
- Flask-CORS
- SQLite
- yfinance
- pandas
- numpy
- scikit-learn
- requests
- vaderSentiment
- APScheduler
- python-dotenv

## Architecture

The application follows a client-server architecture:

- **React + TypeScript frontend** for dashboard pages, charts, cards, search, profile flows, watchlists, alerts, and export UI
- **Flask backend** for API routing, market data retrieval, sentiment analysis, technical indicators, prediction logic, personalization, caching, and alert checks
- **SQLite database** for users, watchlists, alerts, sent-news tracking, and cached API responses
- **External data sources** for stock prices and news used by the analytics pipeline

## Repository Structure

```text
financial-market-analytics/
├── backend/
│   ├── app/
│   │   ├── routes/
│   │   │   ├── alerts.py
│   │   │   ├── auth.py
│   │   │   ├── stocks.py
│   │   │   └── watchlists.py
│   │   ├── services/
│   │   │   ├── alert_check_service.py
│   │   │   ├── cache.py
│   │   │   ├── feature_engineering_service.py
│   │   │   ├── indicators_service.py
│   │   │   ├── market_data.py
│   │   │   ├── news_alert_service.py
│   │   │   ├── notification_service.py
│   │   │   ├── prediction_service.py
│   │   │   └── sentiment_service.py
│   │   ├── __init__.py
│   │   └── db.py
│   ├── requirements.txt
│   └── run.py
├── public/
├── src/
│   ├── components/
│   ├── pages/
│   ├── services/
│   ├── styles/
│   └── types/
├── package.json
├── vite.config.ts
└── README.md
```

## Main Pages

- **Landing Page**
- **Dashboard Page**
- **Watchlist Page**
- **Alerts Page**
- **Profile Page**
- **Login / Signup Pages**
- **Onboarding Page**

## Core API Endpoints

### Market and analytics
- `GET /api/health`
- `GET /api/search?q=AAPL`
- `GET /api/stock?ticker=AAPL`
- `GET /api/history?ticker=AAPL&range=1Y`
- `GET /api/indicator_series?ticker=AAPL&period=6mo&interval=1d`
- `GET /api/sentiment?ticker=AAPL`
- `GET /api/prediction?ticker=AAPL&risk=Moderate`
- `GET /api/recommendations/<user_id>`

### User and profile
- `POST /api/signup`
- `POST /api/login`
- `GET /api/profile/<user_id>`
- `PUT /api/profile/<user_id>`
- `DELETE /api/profile/<user_id>`

### Watchlists
- `GET /api/users/<user_id>/watchlists`
- `GET /api/watchlists/<watchlist_id>/tickers`
- `POST /api/watchlists/<watchlist_id>/tickers`
- `DELETE /api/watchlists/<watchlist_id>/tickers/<ticker>`

### Alerts
- `GET /api/users/<user_id>/alerts`
- `POST /api/users/<user_id>/alerts`
- `POST /api/users/<user_id>/alerts/check`
- `DELETE /api/alerts/<alert_id>`

## Database Tables

The backend initializes the database automatically and creates the main tables used by the application:
- `users`
- `watchlists`
- `watchlist_items`
- `alerts`
- `news_alerts_sent`
- `cache`

## Getting Started

## 1. Clone the repository

```bash
git clone <your-repo-url>
cd financial-market-analytics
```

## 2. Frontend setup

From the project root:

```bash
npm install
npm run dev
```

The Vite frontend runs on:

```text
http://127.0.0.1:5173
```

## 3. Backend setup

Open a second terminal:

```bash
cd backend
python -m venv .venv
```

### Windows
```bash
.venv\Scripts\activate
```

### macOS / Linux
```bash
source .venv/bin/activate
```

Install backend dependencies:

```bash
pip install -r requirements.txt
```

Because the current code imports a few packages that are not fully listed in `backend/requirements.txt`, install these as well if needed:

```bash
pip install apscheduler requests numpy vaderSentiment
```

Run the backend:

```bash
python run.py
```

The Flask backend runs on:

```text
http://127.0.0.1:5000
```

## Environment Variables

Create a `.env` file inside `backend/` if you want optional integrations:

```env
NEWS_API_KEY=your_newsapi_key
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USERNAME=your_email_username
SMTP_PASSWORD=your_email_password
SMTP_FROM=your_sender_email
```

### Notes
- `NEWS_API_KEY` improves news coverage for sentiment analysis.
- If NewsAPI is unavailable, the backend attempts to fall back to Yahoo Finance news.
- SMTP settings are required for email alert delivery.

## How the Application Works

1. The user searches for a stock by ticker or company name.
2. The frontend requests live quote and historical data from the Flask backend.
3. The backend retrieves market data, computes price metrics, and caches responses.
4. Historical data is processed into SMA20, SMA50, and RSI14 indicators.
5. News articles are collected and analyzed with VADER sentiment scoring.
6. The prediction service builds features from market and sentiment data and runs a Random Forest model.
7. Personalized recommendations are generated from saved user preferences such as risk tolerance, goal, horizon, and favorite sectors.
8. Users can save tickers, create alerts, and export results as PDF or Excel.

## Screenshots

Add your screenshots to a folder such as `docs/images/` and reference them here.

```md
![Dashboard](docs/images/dashboard.png)
![Technical Indicators](docs/images/technical-indicators.png)
![Sentiment Analysis](docs/images/sentiment-card.png)
![Prediction Panel](docs/images/prediction-card.png)
![Watchlist](docs/images/watchlist.png)
![Alerts](docs/images/alerts.png)
```

## Suggested Demo GIFs

If you want this README to look more polished on GitHub, add short GIFs for:
- stock search and live dashboard update
- timeframe switching on the historical chart
- sentiment card loading
- AI/ML prediction update when risk profile changes
- adding a stock to watchlist
- creating an alert
- exporting PDF or Excel

## Deployment Notes

This repository is currently structured for local development first.

Before deployment, you should review the following:
- The frontend currently uses a fixed backend base URL in `src/services/api.ts`.
- For production, move the API base URL to a Vite environment variable such as `VITE_API_BASE_URL`.
- Configure CORS for your deployed frontend origin instead of allowing all origins.
- Store secrets in environment variables, not committed files.
- Replace educational-grade authentication with secure password hashing and proper session or token handling before public deployment.

## Limitations

This project was developed as a senior design educational application, so several features are intentionally lightweight or still evolving:
- market data depends on third-party availability
- news sentiment quality depends on available articles
- model outputs are decision-support signals, not guaranteed forecasts
- SMS and push notifications are not fully implemented
- authentication is basic and should be hardened before production use

## Future Improvements

- Add more technical indicators such as MACD and Bollinger Bands
- Improve model training and feature engineering
- Add portfolio tracking and performance analytics
- Move configuration to environment-driven frontend and backend builds
- Strengthen authentication and security for production use
- Add cloud deployment and CI/CD workflows
- Expand automated testing inside the repository

## Contributors

- Shi Qing Ng
- William Kaufman
- Ryan Kahle
- Bryant Ngew

## Project Context

This project was developed as a senior design project at The University of Toledo.

## Disclaimer

This repository is intended for educational and demonstration purposes only.
It should not be used as a substitute for professional financial advice or as a production trading platform without additional security, validation, and infrastructure work.
