from __future__ import annotations

import numpy as np
import pandas as pd


def build_feature_dataframe(
    df: pd.DataFrame,
    sentiment_score: float = 0.0
) -> pd.DataFrame:
    if df is None or df.empty or "Close" not in df.columns:
        raise ValueError("Input dataframe must contain Close prices")

    data = df.copy()

    data["return_1d"] = data["Close"].pct_change(1)
    data["return_5d"] = data["Close"].pct_change(5)
    data["return_10d"] = data["Close"].pct_change(10)

    data["sma20"] = data["Close"].rolling(20).mean()
    data["sma50"] = data["Close"].rolling(50).mean()

    data["price_vs_sma20"] = data["Close"] / data["sma20"] - 1.0
    data["price_vs_sma50"] = data["Close"] / data["sma50"] - 1.0

    data["volatility_10d"] = data["Close"].pct_change().rolling(10).std()

    delta = data["Close"].diff()
    gain = delta.clip(lower=0)
    loss = -delta.clip(upper=0)

    avg_gain = gain.rolling(14).mean()
    avg_loss = loss.rolling(14).mean().replace(0, np.nan)

    rs = avg_gain / avg_loss
    data["rsi14"] = 100 - (100 / (1 + rs))

    if "Volume" in data.columns:
        data["volume_change_5d"] = data["Volume"].pct_change(5)
    else:
        data["volume_change_5d"] = 0.0

    data["sentiment_score"] = float(sentiment_score)

    data["future_close_7d"] = data["Close"].shift(-7)
    data["future_return_7d"] = data["future_close_7d"] / data["Close"] - 1.0

    def classify_target(x: float) -> str:
        if pd.isna(x):
            return np.nan
        if x > 0.01:
            return "Up"
        if x < -0.01:
            return "Down"
        return "Stable"

    data["target"] = data["future_return_7d"].apply(classify_target)

    return data.copy()


def get_feature_columns() -> list[str]:
    return [
        "return_1d",
        "return_5d",
        "return_10d",
        "sma20",
        "sma50",
        "price_vs_sma20",
        "price_vs_sma50",
        "volatility_10d",
        "rsi14",
        "volume_change_5d",
        "sentiment_score",
    ]


def build_prediction_explanation(
    row: pd.Series,
    predicted_label: str,
    sentiment_score: float = 0.0
) -> str:
    reasons: list[str] = []

    rsi = float(row.get("rsi14", 50.0))
    p_vs_sma20 = float(row.get("price_vs_sma20", 0.0))
    p_vs_sma50 = float(row.get("price_vs_sma50", 0.0))
    ret_5d = float(row.get("return_5d", 0.0))

    if p_vs_sma20 > 0:
        reasons.append("price is above SMA20")
    else:
        reasons.append("price is below SMA20")

    if p_vs_sma50 > 0:
        reasons.append("price is above SMA50")
    else:
        reasons.append("price is below SMA50")

    if rsi >= 70:
        reasons.append("RSI indicates overbought conditions")
    elif rsi <= 30:
        reasons.append("RSI indicates oversold conditions")
    else:
        reasons.append("RSI is in a neutral range")

    if ret_5d > 0:
        reasons.append("recent 5-day momentum is positive")
    elif ret_5d < 0:
        reasons.append("recent 5-day momentum is negative")

    if sentiment_score >= 0.15:
        reasons.append("recent news sentiment is positive")
    elif sentiment_score <= -0.15:
        reasons.append("recent news sentiment is negative")
    else:
        reasons.append("recent news sentiment is neutral")

    if predicted_label == "Up":
        prefix = "The model expects upward movement because "
    elif predicted_label == "Down":
        prefix = "The model expects downward movement because "
    else:
        prefix = "The model expects sideways movement because "

    return prefix + ", ".join(reasons[:4]) + "."