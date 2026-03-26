import time
import yfinance as yf

def _rolling_sma_series(values, window: int):
    out = []
    running_sum = 0.0

    for i, value in enumerate(values):
        running_sum += value

        if i >= window:
            running_sum -= values[i - window]

        if i >= window - 1:
            out.append(running_sum / window)
        else:
            out.append(None)

    return out


def _rsi_series(closes, period: int = 14):
    n = len(closes)
    if n < period + 1:
        return [None] * n

    rsis = [None] * n
    gains = 0.0
    losses = 0.0

    for i in range(1, period + 1):
        diff = closes[i] - closes[i - 1]
        if diff >= 0:
            gains += diff
        else:
            losses += -diff

    avg_gain = gains / period
    avg_loss = losses / period

    def calc_rsi(ag, al):
        if al == 0:
            return 100.0
        rs = ag / al
        return 100.0 - (100.0 / (1.0 + rs))

    rsis[period] = calc_rsi(avg_gain, avg_loss)

    for i in range(period + 1, n):
        diff = closes[i] - closes[i - 1]
        gain = diff if diff > 0 else 0.0
        loss = (-diff) if diff < 0 else 0.0

        avg_gain = ((avg_gain * (period - 1)) + gain) / period
        avg_loss = ((avg_loss * (period - 1)) + loss) / period
        rsis[i] = calc_rsi(avg_gain, avg_loss)

    return rsis


def build_indicator_series(ticker: str, period: str = "6mo", interval: str = "1d"):
    try:
        t = yf.Ticker(ticker)
        hist = t.history(period=period, interval=interval)

        if hist is None:
            print(f"Indicator fetch failed for {ticker}: hist is None")
            return {
                "ticker": ticker,
                "period": period,
                "interval": interval,
                "timestamps": [],
                "close": [],
                "sma20": [],
                "sma50": [],
                "rsi14": [],
                "updatedAt": int(time.time()),
            }

        if hist.empty:
            print(f"Indicator fetch failed for {ticker}: hist is empty")
            return {
                "ticker": ticker,
                "period": period,
                "interval": interval,
                "timestamps": [],
                "close": [],
                "sma20": [],
                "sma50": [],
                "rsi14": [],
                "updatedAt": int(time.time()),
            }

        if "Close" not in hist.columns:
            print(f"Indicator fetch failed for {ticker}: Close column missing")
            print("Columns returned:", list(hist.columns))
            return {
                "ticker": ticker,
                "period": period,
                "interval": interval,
                "timestamps": [],
                "close": [],
                "sma20": [],
                "sma50": [],
                "rsi14": [],
                "updatedAt": int(time.time()),
            }

        hist2 = hist.dropna(subset=["Close"]).copy()
        closes = [float(x) for x in hist2["Close"].tolist()]
        dates = [idx.strftime("%Y-%m-%d") for idx in hist2.index]

        print(f"{ticker} raw rows: {len(hist)}")
        print(f"{ticker} close rows after dropna: {len(closes)}")

        if len(closes) < 15:
            print(f"Indicator fetch failed for {ticker}: not enough close values for RSI")
            return {
                "ticker": ticker,
                "period": period,
                "interval": interval,
                "timestamps": dates,
                "close": closes,
                "sma20": _rolling_sma_series(closes, 20),
                "sma50": _rolling_sma_series(closes, 50),
                "rsi14": [None] * len(closes),
                "updatedAt": int(time.time()),
            }

        sma20 = _rolling_sma_series(closes, 20)
        sma50 = _rolling_sma_series(closes, 50)
        rsi14 = _rsi_series(closes, 14)

        print(f"{ticker} last 5 RSI values: {rsi14[-5:] if len(rsi14) >= 5 else rsi14}")

        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "timestamps": dates,
            "close": closes,
            "sma20": sma20,
            "sma50": sma50,
            "rsi14": rsi14,
            "updatedAt": int(time.time()),
        }

    except Exception as e:
        print(f"Indicator fetch failed for {ticker}: {e}")
        return {
            "ticker": ticker,
            "period": period,
            "interval": interval,
            "timestamps": [],
            "close": [],
            "sma20": [],
            "sma50": [],
            "rsi14": [],
            "updatedAt": int(time.time()),
        }