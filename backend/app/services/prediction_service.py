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


# def build_ai_interpretation(
#     trend: str,
#     confidence: float,
#     sentiment_score: float,
#     risk_profile: str = "Moderate",
# ) -> Dict[str, str]:
#     risk_profile = (risk_profile or "Moderate").strip()

#     interpretation = ""
#     suggested_action = "Watchlist"
#     action_reason = ""
#     risk_message = ""

#     strong_bullish = trend == "Up" and confidence >= 70 and sentiment_score >= 0.15
#     mild_bullish = trend == "Up" and confidence >= 60
#     bearish = trend == "Down" and confidence >= 60
#     weak_signal = confidence < 55

#     # Simple interpretation for beginner users
#     if strong_bullish:
#         interpretation = (
#             "The model sees a positive short-term trend. "
#             "Recent price movement and market sentiment both support the chance of the stock moving higher."
#         )
#     elif bearish or weak_signal:
#         interpretation = (
#             "The model sees a weak or negative short-term trend. "
#             "Current signals suggest the stock may face downward pressure or uncertain movement."
#         )
#     else:
#         interpretation = (
#             "The signals are mixed. "
#             "Some indicators look positive, but others are neutral or weak."
#         )

#     # Suggested action based on selected risk profile
#     if risk_profile == "Conservative":
#         if strong_bullish:
#             suggested_action = "Watchlist"
#             action_reason = (
#                 "Even though the signal is positive, conservative investors usually wait for stronger confirmation before taking action."
#             )
#         elif bearish or weak_signal:
#             suggested_action = "Caution"
#             action_reason = (
#                 "The signal is weak or negative, which may carry higher risk for conservative investors."
#             )
#         else:
#             suggested_action = "Caution"
#             action_reason = (
#                 "Because the signals are mixed, waiting and monitoring the stock may be safer."
#             )

#     elif risk_profile == "Aggressive":
#         if strong_bullish or mild_bullish:
#             suggested_action = "Opportunity"
#             action_reason = (
#                 "Aggressive investors are more comfortable acting on early upward signals and momentum."
#             )
#         elif bearish:
#             suggested_action = "Caution"
#             action_reason = (
#                 "Even aggressive investors should be careful when the model detects a downward trend."
#             )
#         else:
#             suggested_action = "Watchlist"
#             action_reason = (
#                 "The signal is not strong yet, but aggressive investors may continue watching for a possible entry point."
#             )

#     else:  # Moderate
#         if strong_bullish:
#             suggested_action = "Opportunity"
#             action_reason = (
#                 "The model detects an upward trend with support from both market sentiment and price movement."
#             )
#         elif bearish or weak_signal:
#             suggested_action = "Caution"
#             action_reason = (
#                 "The model sees possible downside risk or weak confirmation, which may not be ideal for a balanced investor."
#             )
#         else:
#             suggested_action = "Watchlist"
#             action_reason = (
#                 "Because the signals are mixed, it may be better to monitor the stock before making a decision."
#             )

#     # Risk profile message
#     if risk_profile == "Conservative":
#         if trend == "Down":
#             risk_message = (
#                 "Conservative profile: this setup suggests caution. Waiting for clearer signals may help reduce risk."
#             )
#         elif trend == "Up" and confidence >= 75:
#             risk_message = (
#                 "Conservative profile: this trend may be worth monitoring, but stronger confirmation is still important before acting."
#             )
#         else:
#             risk_message = (
#                 "Conservative profile: weaker signals are usually avoided until stronger confirmation appears."
#             )

#     elif risk_profile == "Aggressive":
#         if trend == "Up":
#             risk_message = (
#                 "Aggressive profile: the model detects upward momentum, which may present a higher-risk growth opportunity."
#             )
#         elif trend == "Down":
#             risk_message = (
#                 "Aggressive profile: the model detects downward momentum, so risk management is especially important."
#             )
#         else:
#             risk_message = (
#                 "Aggressive profile: a neutral signal may still be monitored for improving momentum."
#             )

#     else:  # Moderate
#         if trend == "Up":
#             risk_message = (
#                 "Moderate profile: the signals may support a balanced opportunity if conditions remain stable."
#             )
#         elif trend == "Down":
#             risk_message = (
#                 "Moderate profile: the model suggests caution until market signals improve."
#             )
#         else:
#             risk_message = (
#                 "Moderate profile: a neutral outlook may justify waiting rather than acting immediately."
#             )

#     return {
#         "interpretation": interpretation,
#         "suggestedAction": suggested_action,
#         "actionReason": action_reason,
#         "riskMessage": risk_message,
#     }


# def predict_stock_trend(ticker: str, risk_profile: str = "Moderate") -> Dict[str, Any]:
#     ticker = (ticker or "").strip().upper()
#     if not ticker:
#         raise ValueError("ticker required")

#     df = yf.Ticker(ticker).history(period="5y", interval="1d")

#     if df is None or df.empty or "Close" not in df.columns:
#         raise RuntimeError(f"No data found for {ticker}")

#     # Get latest sentiment
#     try:
#         sentiment_payload = get_sentiment(ticker)
#         sentiment_score = float(sentiment_payload.get("score", 0.0))
#         sentiment_label = sentiment_payload.get("label", "Neutral")
#     except Exception:
#         sentiment_score = 0.0
#         sentiment_label = "Neutral"

#     # Build features
#     data = build_feature_dataframe(df, sentiment_score=sentiment_score)
#     feature_cols = get_feature_columns()

#     import numpy as np

#     # Clean dataset first
#     data = data.replace([np.inf, -np.inf], np.nan)
#     data = data.dropna(subset=feature_cols + ["target"])

#     if len(data) < 120:
#         raise RuntimeError("Not enough valid historical data to train prediction model")

#     X = data[feature_cols].fillna(0)
#     y = data["target"]

#     # Train on earlier data
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

#     # Predict using latest available row
#     latest_features = X.iloc[[-1]].replace([np.inf, -np.inf], 0).fillna(0)
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

#     ai_fields = build_ai_interpretation(
#         trend=predicted_label,
#         confidence=confidence,
#         sentiment_score=sentiment_score,
#         risk_profile=risk_profile,
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
#         "interpretation": ai_fields["interpretation"],
#         "suggestedAction": ai_fields["suggestedAction"],
#         "actionReason": ai_fields["actionReason"],
#         "riskMessage": ai_fields["riskMessage"],
#     }

from __future__ import annotations

from typing import Any, Dict

import numpy as np
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

    strong_bullish = trend == "Up" and confidence >= 70 and sentiment_score >= 0.15
    mild_bullish = trend == "Up" and confidence >= 60
    bearish = trend == "Down" and confidence >= 60
    weak_signal = confidence < 55

    if strong_bullish:
        interpretation = (
            "The model sees a positive short-term trend. "
            "Recent price movement and market sentiment both support the chance of the stock moving higher."
        )
    elif bearish or weak_signal:
        interpretation = (
            "The model sees a weak or negative short-term trend. "
            "Current signals suggest the stock may face downward pressure or uncertain movement."
        )
    else:
        interpretation = (
            "The signals are mixed. "
            "Some indicators look positive, but others are neutral or weak."
        )

    if risk_profile == "Conservative":
        if strong_bullish:
            suggested_action = "Watchlist"
            action_reason = (
                "Even though the signal is positive, conservative investors usually wait for stronger confirmation before taking action."
            )
        elif bearish or weak_signal:
            suggested_action = "Caution"
            action_reason = (
                "The signal is weak or negative, which may carry higher risk for conservative investors."
            )
        else:
            suggested_action = "Caution"
            action_reason = (
                "Because the signals are mixed, waiting and monitoring the stock may be safer."
            )

    elif risk_profile == "Aggressive":
        if strong_bullish or mild_bullish:
            suggested_action = "Opportunity"
            action_reason = (
                "Aggressive investors are more comfortable acting on early upward signals and momentum."
            )
        elif bearish:
            suggested_action = "Caution"
            action_reason = (
                "Even aggressive investors should be careful when the model detects a downward trend."
            )
        else:
            suggested_action = "Watchlist"
            action_reason = (
                "The signal is not strong yet, but aggressive investors may continue watching for a possible entry point."
            )

    else:
        if strong_bullish:
            suggested_action = "Opportunity"
            action_reason = (
                "The model detects an upward trend with support from both market sentiment and price movement."
            )
        elif bearish or weak_signal:
            suggested_action = "Caution"
            action_reason = (
                "The model sees possible downside risk or weak confirmation, which may not be ideal for a balanced investor."
            )
        else:
            suggested_action = "Watchlist"
            action_reason = (
                "Because the signals are mixed, it may be better to monitor the stock before making a decision."
            )

    if risk_profile == "Conservative":
        if trend == "Down":
            risk_message = (
                "Conservative profile: this setup suggests caution. Waiting for clearer signals may help reduce risk."
            )
        elif trend == "Up" and confidence >= 75:
            risk_message = (
                "Conservative profile: this trend may be worth monitoring, but stronger confirmation is still important before acting."
            )
        else:
            risk_message = (
                "Conservative profile: weaker signals are usually avoided until stronger confirmation appears."
            )

    elif risk_profile == "Aggressive":
        if trend == "Up":
            risk_message = (
                "Aggressive profile: the model detects upward momentum, which may present a higher-risk growth opportunity."
            )
        elif trend == "Down":
            risk_message = (
                "Aggressive profile: the model detects downward momentum, so risk management is especially important."
            )
        else:
            risk_message = (
                "Aggressive profile: a neutral signal may still be monitored for improving momentum."
            )

    else:
        if trend == "Up":
            risk_message = (
                "Moderate profile: the signals may support a balanced opportunity if conditions remain stable."
            )
        elif trend == "Down":
            risk_message = (
                "Moderate profile: the model suggests caution until market signals improve."
            )
        else:
            risk_message = (
                "Moderate profile: a neutral outlook may justify waiting rather than acting immediately."
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

    df = yf.Ticker(ticker).history(period="5y", interval="1d", auto_adjust=False)

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

    data = data.replace([np.inf, -np.inf], np.nan)
    data = data.dropna(subset=feature_cols + ["target"]).copy()

    if len(data) < 120:
        raise RuntimeError(
            f"Not enough valid historical data to train prediction model for {ticker}"
        )

    X = data[feature_cols].fillna(0)
    y = data["target"]

    if y.nunique() < 2:
        raise RuntimeError(
            f"Prediction model could not train for {ticker} because only one target class was found."
        )

    split_index = int(len(data) * 0.8)

    X_train = X.iloc[:split_index]
    y_train = y.iloc[:split_index]

    if len(X_train) < 50:
        raise RuntimeError(f"Not enough training rows for {ticker}")

    model = RandomForestClassifier(
        n_estimators=200,
        max_depth=8,
        min_samples_leaf=3,
        random_state=42,
    )
    model.fit(X_train, y_train)

    latest_features = X.iloc[[-1]].replace([np.inf, -np.inf], 0).fillna(0)
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