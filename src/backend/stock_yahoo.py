# Install yfinance
import yfinance as yf

#Defines a function to fetch stock information from Yahoo Finance
def get_stock_overview(symbol):
    symbol = symbol.strip().upper()
    ticker = yf.Ticker(symbol)

    info = ticker.fast_info

    price = info["last_price"]
    prev_close = info["previous_close"]

    change = price - prev_close
    change_percent = (change / prev_close) * 100

    return {
        "symbol": symbol,
        "price": round(price, 2),
        "change": round(change, 2),
        "changePercent": round(change_percent, 2),
    }

print("Testing Yahoo Finance...")
print(get_stock_overview("AAPL"))