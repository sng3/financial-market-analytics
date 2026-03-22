# from __future__ import annotations

# from typing import Any, Dict

# import yfinance as yf
# from sklearn.ensemble import RandomForestClassifier

# from app.services.feature_engineering_service import (
#     build_feature_dataframe,
#     get_feature_columns,
#     build_prediction_explanation,
# )
# from app.services.sentiment_service import get_sentiment


# def predict_stock_trend(ticker: str) -> Dict[str, Any]:
#     ticker = (ticker or "").strip().upper()
#     if not ticker:
#         raise ValueError("ticker required")

#     df = yf.Ticker(ticker).history(period="5y", interval="1d")

#     if df is None or df.empty or "Close" not in df.columns:
#         raise RuntimeError(f"No data found for {ticker}")

#     # Pull latest sentiment
#     try:
#         sentiment_payload = get_sentiment(ticker)
#         sentiment_score = float(sentiment_payload.get("score", 0.0))
#         sentiment_label = sentiment_payload.get("label", "Neutral")
#     except Exception:
#         sentiment_score = 0.0
#         sentiment_label = "Neutral"

#     data = build_feature_dataframe(df, sentiment_score=sentiment_score)
#     feature_cols = get_feature_columns()

#     if len(data) < 120:
#         raise RuntimeError("Not enough historical data to train prediction model")

#     X = data[feature_cols]
#     y = data["target"]

#     split_index = int(len(data) * 0.8)
#     X_train = X.iloc[:split_index]
#     y_train = y.iloc[:split_index]

#     model = RandomForestClassifier(
#         n_estimators=200,
#         max_depth=8,
#         min_samples_leaf=3,
#         random_state=42,
#     )
#     model.fit(X_train, y_train)

#     latest_features = X.iloc[[-1]]
#     latest_row = data.iloc[-1]

#     predicted_label = str(model.predict(latest_features)[0])
#     class_probs = model.predict_proba(latest_features)[0]
#     classes = list(model.classes_)

#     prob_map = {label: float(prob) for label, prob in zip(classes, class_probs)}
#     confidence = round(prob_map.get(predicted_label, 0.0) * 100, 2)

#     explanation = build_prediction_explanation(
#         latest_row,
#         predicted_label,
#         sentiment_score=sentiment_score,
#     )


#     return {
#         "ticker": ticker,
#         "horizon": "7-day",
#         "trend": predicted_label,
#         "confidence": confidence,
#         "featuresUsed": feature_cols,
#         "sentimentScore": sentiment_score,
#         "sentimentLabel": sentiment_label,
#         "explanation": explanation,
#     }

from __future__ import annotations

from typing import Any, Dict

import yfinance as yf
from sklearn.ensemble import RandomForestClassifier

from app.services.feature_engineering_service import (
    build_feature_dataframe,
    get_feature_columns,
    build_prediction_explanation,
)
from app.services.sentiment_service import get_sentiment


def build_ai_interpretation(
    trend: str,
    confidence: float,
    sentiment_score: float,
    risk_profile: str = "Moderate",
) -> Dict[str, str]:
    risk_profile = (risk_profile or "Moderate").strip()

    interpretation = ""
    suggested_action = "Watchlist"
    action_reason = ""
    risk_message = ""

    if trend == "Up" and confidence >= 70 and sentiment_score >= 0.15:
        interpretation = "Bullish short-term outlook with supportive confirmation."
        suggested_action = "Opportunity" if risk_profile != "Conservative" else "Watchlist"
        action_reason = (
            "Trend is upward, model confidence is relatively strong, and sentiment is supportive."
        )
    elif trend == "Down" or confidence < 55:
        interpretation = "Bearish or weak short-term outlook with limited confirmation."
        suggested_action = "Caution"
        action_reason = (
            "The model sees downside risk or insufficient confirmation strength for a favorable setup."
        )
    else:
        interpretation = "Mixed short-term outlook requiring additional confirmation."
        suggested_action = "Watchlist"
        action_reason = (
            "Signals are not fully aligned, so the stock may be better monitored than acted on immediately."
        )

    if risk_profile == "Conservative":
        if trend == "Down":
            risk_message = (
                "Conservative profile: this setup suggests caution and waiting for stronger confirmation before acting."
            )
        elif trend == "Up" and confidence >= 75:
            risk_message = (
                "Conservative profile: this may be worth monitoring, but confirmation and tight risk control remain important."
            )
        else:
            risk_message = (
                "Conservative profile: avoid weaker signals unless they are supported by stronger confirmation."
            )
    elif risk_profile == "Aggressive":
        if trend == "Up":
            risk_message = (
                "Aggressive profile: this may support a higher-risk growth opportunity if your entry and exit rules are defined."
            )
            if confidence >= 60:
                suggested_action = "Opportunity"
        elif trend == "Down":
            risk_message = (
                "Aggressive profile: this may reflect downside momentum, but strict risk controls are essential."
            )
        else:
            risk_message = (
                "Aggressive profile: the current outlook is neutral, so stronger momentum may be needed before acting."
            )
    else:
        if trend == "Up":
            risk_message = (
                "Moderate profile: this may support a balanced opportunity if technical and sentiment conditions remain aligned."
            )
        elif trend == "Down":
            risk_message = (
                "Moderate profile: this suggests caution until technical conditions improve."
            )
        else:
            risk_message = (
                "Moderate profile: a neutral outlook may justify patience rather than immediate action."
            )

    if risk_profile == "Conservative" and suggested_action == "Opportunity":
        suggested_action = "Watchlist"
        action_reason += (
            " Because the selected risk profile is conservative, the signal is better treated as a monitored opportunity."
        )

    return {
        "interpretation": interpretation,
        "suggestedAction": suggested_action,
        "actionReason": action_reason,
        "riskMessage": risk_message,
    }


def predict_stock_trend(ticker: str, risk_profile: str = "Moderate") -> Dict[str, Any]:
    ticker = (ticker or "").strip().upper()
    if not ticker:
        raise ValueError("ticker required")

    df = yf.Ticker(ticker).history(period="5y", interval="1d")

    if df is None or df.empty or "Close" not in df.columns:
        raise RuntimeError(f"No data found for {ticker}")

    try:
        sentiment_payload = get_sentiment(ticker)
        sentiment_score = float(sentiment_payload.get("score", 0.0))
        sentiment_label = sentiment_payload.get("label", "Neutral")
    except Exception:
        sentiment_score = 0.0
        sentiment_label = "Neutral"

    data = build_feature_dataframe(df, sentiment_score=sentiment_score)
    feature_cols = get_feature_columns()

    if len(data) < 120:
        raise RuntimeError("Not enough historical data to train prediction model")

    X = data[feature_cols]
    y = data["target"]

    split_index = int(len(data) * 0.8)
    X_train = X.iloc[:split_index]
    y_train = y.iloc[:split_index]

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=3,
        random_state=42,
    )
    model.fit(X_train, y_train)

    latest_features = X.iloc[[-1]]
    latest_row = data.iloc[-1]

    predicted_label = str(model.predict(latest_features)[0])
    class_probs = model.predict_proba(latest_features)[0]
    classes = list(model.classes_)

    prob_map = {label: float(prob) for label, prob in zip(classes, class_probs)}
    confidence = round(prob_map.get(predicted_label, 0.0) * 100, 2)

    explanation = build_prediction_explanation(
        latest_row,
        predicted_label,
        sentiment_score=sentiment_score,
    )

    ai_fields = build_ai_interpretation(
        trend=predicted_label,
        confidence=confidence,
        sentiment_score=sentiment_score,
        risk_profile=risk_profile,
    )

    return {
        "ticker": ticker,
        "horizon": "7-day",
        "trend": predicted_label,
        "confidence": confidence,
        "featuresUsed": feature_cols,
        "sentimentScore": sentiment_score,
        "sentimentLabel": sentiment_label,
        "explanation": explanation,
        "interpretation": ai_fields["interpretation"],
        "suggestedAction": ai_fields["suggestedAction"],
        "actionReason": ai_fields["actionReason"],
        "riskMessage": ai_fields["riskMessage"],
    }