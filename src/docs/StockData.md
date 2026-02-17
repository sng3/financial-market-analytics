# Stock Data Plan

## Purpose
Provide Robinhood-style stock information (price, change, basic chart history, company info) in our app.

## Data We Need (MVP)
### Quote (for a ticker like AAPL)
- symbol
- lastPrice
- changeDollar
- changePercent
- open
- high
- low
- previousClose
- volume
- timestamp

### Chart / History
- historical OHLC (or at minimum close prices) for:
  - 1D (5m or 15m candles)
  - 1W (30m or 1h candles)
  - 1M (daily)
  - 1Y (daily/weekly)

### Company Info
- companyName
- sector/industry
- description (short)

## API Info
- Will be using Yahoo Finance as our API Call for information

