#import yahoo finance as yf
import yfinance as yf

#function to get a stock overview
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

#example usage
print("Testing Yahoo Finance...")
print(get_stock_overview("AAPL"))
