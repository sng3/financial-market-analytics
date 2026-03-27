import ExcelJS from "exceljs";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";

export type ExportHistoryPoint = {
  date?: string;
  close?: number | null;
};

export type ExportSentimentItem = {
  title?: string;
  publisher?: string;
  score?: number | null;
  publishedAt?: string | null;
  url?: string | null;
  imageUrl?: string | null;
};

export type ExportPayload = {
  ticker: string;
  companyName?: string | null;

  stock?: {
    price?: number | null;
    change?: number | null;
    changePct?: number | null;
    updatedAt?: string | null;
    marketStatus?: string | null;
    atCloseUpdatedAt?: string | null;
    extendedLabel?: string | null;
    extendedPrice?: number | null;
    extendedChange?: number | null;
    extendedChangePct?: number | null;
    extendedUpdatedAt?: string | null;
  };

  sentiment?: {
    label?: string | null;
    score?: number | null;
    confidence?: number | null;
    provider?: string | null;
    status?: string | null;
    warning?: string | null;
    items?: ExportSentimentItem[];
  };

  indicators?: {
    latestRsi?: number | null;
    smaTrend?: "Up" | "Down" | "Flat" | string | null;
    latestSma20?: number | null;
    latestSma50?: number | null;
    timestamps?: string[];
    close?: Array<number | null>;
    sma20?: Array<number | null>;
    sma50?: Array<number | null>;
    rsi14?: Array<number | null>;
  };

  prediction?: {
    horizon?: string | null;
    trend?: string | null;
    confidence?: number | null;
    sentimentLabel?: string | null;
    sentimentScore?: number | null;
    interpretation?: string | null;
    suggestedAction?: string | null;
    actionReason?: string | null;
    explanation?: string | null;
    riskMessage?: string | null;
    riskProfile?: string | null;
  };

  history?: ExportHistoryPoint[];
  generatedAt?: string;
};

function autoFitColumns(worksheet: ExcelJS.Worksheet) {
  worksheet.columns?.forEach((column) => {
    let maxLength = 12;

    column.eachCell?.({ includeEmpty: true }, (cell) => {
      const cellValue = cell.value == null ? "" : String(cell.value);
      maxLength = Math.max(maxLength, cellValue.length + 2);
    });

    column.width = Math.min(maxLength, 60);
  });
}

function styleHeaderRow(worksheet: ExcelJS.Worksheet, rowNumber = 1) {
  const row = worksheet.getRow(rowNumber);
  row.font = { bold: true };
  row.alignment = { vertical: "middle", horizontal: "center" };

  row.eachCell((cell) => {
    cell.fill = {
      type: "pattern",
      pattern: "solid",
      fgColor: { argb: "D9EAF7" },
    };
    cell.border = {
      top: { style: "thin" },
      left: { style: "thin" },
      bottom: { style: "thin" },
      right: { style: "thin" },
    };
  });
}

function styleBodyBorders(worksheet: ExcelJS.Worksheet) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    row.eachCell((cell) => {
      cell.border = {
        top: { style: "thin" },
        left: { style: "thin" },
        bottom: { style: "thin" },
        right: { style: "thin" },
      };
      cell.alignment = { vertical: "middle", wrapText: true };
    });
  });
}

function styleAlternatingRows(worksheet: ExcelJS.Worksheet) {
  worksheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    if (rowNumber % 2 === 0) {
      row.eachCell((cell) => {
        cell.fill = {
          type: "pattern",
          pattern: "solid",
          fgColor: { argb: "F7FAFC" },
        };
      });
    }
  });
}

function formatNumber(
  value: number | null | undefined,
  digits = 2
): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return Number(value).toFixed(digits);
}

function formatPercent(
  value: number | null | undefined,
  digits = 2
): string {
  if (value == null || Number.isNaN(value)) return "N/A";
  return `${Number(value).toFixed(digits)}%`;
}

function applyTrendColor(sheet: ExcelJS.Worksheet) {
  sheet.eachRow((row, rowNumber) => {
    if (rowNumber === 1) return;

    const section = String(row.getCell(1).value ?? "");
    const field = String(row.getCell(2).value ?? "");
    const valueCell = row.getCell(3);
    const value = String(valueCell.value ?? "");

    if (
      (section === "Technical Indicators" && field === "SMA Trend") ||
      (section === "Prediction" && field === "Trend")
    ) {
      if (value.toLowerCase() === "up") {
        valueCell.font = { color: { argb: "008000" }, bold: true };
      } else if (value.toLowerCase() === "down") {
        valueCell.font = { color: { argb: "CC0000" }, bold: true };
      } else {
        valueCell.font = { color: { argb: "666666" }, bold: true };
      }
    }
  });
}

function addWrappedText(
  pdf: jsPDF,
  text: string,
  x: number,
  y: number,
  maxWidth: number,
  lineHeight = 5.2
): number {
  const lines = pdf.splitTextToSize(text, maxWidth);
  pdf.text(lines, x, y);
  return y + lines.length * lineHeight;
}

function ensurePageSpace(
  pdf: jsPDF,
  y: number,
  requiredHeight: number,
  topMargin: number,
  bottomMargin: number
): number {
  const pageHeight = pdf.internal.pageSize.getHeight();

  if (y + requiredHeight > pageHeight - bottomMargin) {
    pdf.addPage();
    return topMargin;
  }

  return y;
}

function drawDivider(pdf: jsPDF, x1: number, x2: number, y: number) {
  pdf.setDrawColor(220, 226, 235);
  pdf.setLineWidth(0.3);
  pdf.line(x1, y, x2, y);
}

export async function exportDashboardPDF(payload: ExportPayload) {
  const pdf = new jsPDF("p", "mm", "a4");

  const left = 15;
  const right = 15;
  const top = 16;
  const bottom = 14;
  const maxWidth = pdf.internal.pageSize.getWidth() - left - right;

  let y = top;
  let isFirstSection = true;

  const addSectionTitle = (title: string) => {
    if (!isFirstSection) {
      y += 4;
    }

    y = ensurePageSpace(pdf, y, 14, top, bottom);

    pdf.setFont("helvetica", "bold");
    pdf.setFontSize(12.5);
    pdf.setTextColor(22, 28, 45);
    pdf.text(title, left, y);

    y += 3.5;
    drawDivider(pdf, left, left + maxWidth, y);
    y += 5;

    isFirstSection = false;
  };

  const addBodyText = (text: string) => {
    y = ensurePageSpace(pdf, y, 14, top, bottom);

    pdf.setFont("helvetica", "normal");
    pdf.setFontSize(10.5);
    pdf.setTextColor(60, 68, 82);
    y = addWrappedText(pdf, text, left, y, maxWidth, 5.2);
    y += 2.5;
  };

  pdf.setFont("helvetica", "bold");
  pdf.setFontSize(17);
  pdf.setTextColor(15, 23, 42);
  pdf.text("Financial Market Analytics Report", left, y);
  y += 8;

  pdf.setFont("helvetica", "normal");
  pdf.setFontSize(10.5);
  pdf.setTextColor(80, 90, 105);
  pdf.text(`Ticker: ${payload.ticker}`, left, y);
  y += 5;
  pdf.text(`Company: ${payload.companyName ?? "N/A"}`, left, y);
  y += 5;
  pdf.text(
    `Generated: ${payload.generatedAt ?? new Date().toLocaleString()}`,
    left,
    y
  );
  y += 7;

  drawDivider(pdf, left, left + maxWidth, y);
  y += 7;

  addSectionTitle("Price Overview");
  addBodyText(
    `The current stock price is ${
      payload.stock?.price != null
        ? `$${formatNumber(payload.stock.price)}`
        : "N/A"
    }, with a daily change of ${formatNumber(payload.stock?.change)} (${formatPercent(
      payload.stock?.changePct
    )}). The market status is ${payload.stock?.marketStatus ?? "N/A"}.`
  );

  if (payload.stock?.extendedLabel || payload.stock?.extendedPrice != null) {
    addBodyText(
      `${payload.stock?.extendedLabel ?? "Extended session"} data shows a price of ${
        payload.stock?.extendedPrice != null
          ? `$${formatNumber(payload.stock.extendedPrice)}`
          : "N/A"
      }, with a change of ${formatNumber(
        payload.stock?.extendedChange
      )} (${formatPercent(payload.stock?.extendedChangePct)}).`
    );
  }

  addSectionTitle("Technical Indicators");
  addBodyText(
    `The latest RSI is ${formatNumber(
      payload.indicators?.latestRsi
    )}. The SMA trend is ${payload.indicators?.smaTrend ?? "N/A"}. The latest SMA20 is ${formatNumber(
      payload.indicators?.latestSma20
    )} and the latest SMA50 is ${formatNumber(payload.indicators?.latestSma50)}.`
  );

  addSectionTitle("Market Sentiment");
  addBodyText(
    `Overall market sentiment is ${
      payload.sentiment?.label ?? "N/A"
    } with a sentiment score of ${formatNumber(
      payload.sentiment?.score
    )} and confidence of ${formatPercent(
      payload.sentiment?.confidence
    )}. The source provider is ${payload.sentiment?.provider ?? "N/A"} and the current status is ${
      payload.sentiment?.status ?? "N/A"
    }.`
  );

  if (payload.sentiment?.warning) {
    addBodyText(`Sentiment note: ${payload.sentiment.warning}`);
  }

  const sentimentItems = payload.sentiment?.items ?? [];

  if (sentimentItems.length > 0) {
    const topHeadlines = sentimentItems
      .slice(0, 3)
      .map(
        (item, index) => `${index + 1}. ${item.title ?? "Untitled article"}`
      )
      .join(" ");

    addBodyText(`Top related headlines: ${topHeadlines}`);
  }

  addSectionTitle("Prediction");
  addBodyText(
    `The model predicts a ${
      payload.prediction?.trend ?? "N/A"
    } trend over the ${payload.prediction?.horizon ?? "N/A"} horizon with confidence of ${formatPercent(
      payload.prediction?.confidence
    )}. The selected risk profile is ${payload.prediction?.riskProfile ?? "N/A"}.`
  );

  if (payload.prediction?.suggestedAction) {
    addBodyText(`Suggested action: ${payload.prediction.suggestedAction}.`);
  }

  if (payload.prediction?.interpretation) {
    addBodyText(`Interpretation: ${payload.prediction.interpretation}`);
  }

  if (payload.prediction?.actionReason) {
    addBodyText(`Action reason: ${payload.prediction.actionReason}`);
  }

  if (payload.prediction?.explanation) {
    addBodyText(`Explanation: ${payload.prediction.explanation}`);
  }

  if (payload.prediction?.riskMessage) {
    addBodyText(`Risk note: ${payload.prediction.riskMessage}`);
  }

  addSectionTitle("Historical Trend Note");
  if ((payload.history?.length ?? 0) >= 2) {
    const firstClose = payload.history?.[0]?.close ?? null;
    const lastClose =
      payload.history?.[payload.history.length - 1]?.close ?? null;

    if (firstClose != null && lastClose != null) {
      const direction =
        lastClose > firstClose
          ? "upward"
          : lastClose < firstClose
          ? "downward"
          : "flat";

      addBodyText(
        `Across the exported historical series, the stock shows an overall ${direction} movement from ${formatNumber(
          firstClose
        )} to ${formatNumber(lastClose)}.`
      );
    } else {
      addBodyText(
        "Historical trend data is available, but a complete start-to-end comparison could not be determined."
      );
    }
  } else {
    addBodyText(
      "Historical trend data is limited, so a broader movement summary could not be generated."
    );
  }

  addSectionTitle("Disclaimer");
  addBodyText(
    "This report is for educational use only. It does not constitute financial advice, investment guidance, or a recommendation to buy or sell securities."
  );

  pdf.save(`${payload.ticker}-summary-report.pdf`);
}

export async function exportDashboardExcel(payload: ExportPayload) {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "Financial Market Analytics Web Application";
  workbook.created = new Date();

  const summarySheet = workbook.addWorksheet("Summary");
  summarySheet.columns = [
    { header: "Section", key: "section", width: 22 },
    { header: "Field", key: "field", width: 28 },
    { header: "Value", key: "value", width: 40 },
  ];

  summarySheet.addRows([
    { section: "General", field: "Ticker", value: payload.ticker },
    { section: "General", field: "Company Name", value: payload.companyName ?? "" },
    {
      section: "General",
      field: "Generated At",
      value: payload.generatedAt ?? new Date().toLocaleString(),
    },

    { section: "Price Overview", field: "Price", value: formatNumber(payload.stock?.price) },
    { section: "Price Overview", field: "Change", value: formatNumber(payload.stock?.change) },
    { section: "Price Overview", field: "Change %", value: formatPercent(payload.stock?.changePct) },
    { section: "Price Overview", field: "Updated At", value: payload.stock?.updatedAt ?? "" },
    { section: "Price Overview", field: "Market Status", value: payload.stock?.marketStatus ?? "" },
    { section: "Price Overview", field: "At Close Updated At", value: payload.stock?.atCloseUpdatedAt ?? "" },
    { section: "Price Overview", field: "Extended Label", value: payload.stock?.extendedLabel ?? "" },
    { section: "Price Overview", field: "Extended Price", value: formatNumber(payload.stock?.extendedPrice) },
    { section: "Price Overview", field: "Extended Change", value: formatNumber(payload.stock?.extendedChange) },
    {
      section: "Price Overview",
      field: "Extended Change %",
      value: formatPercent(payload.stock?.extendedChangePct),
    },
    {
      section: "Price Overview",
      field: "Extended Updated At",
      value: payload.stock?.extendedUpdatedAt ?? "",
    },

    {
      section: "Technical Indicators",
      field: "Latest RSI",
      value: formatNumber(payload.indicators?.latestRsi),
    },
    {
      section: "Technical Indicators",
      field: "SMA Trend",
      value: payload.indicators?.smaTrend ?? "",
    },
    {
      section: "Technical Indicators",
      field: "Latest SMA20",
      value: formatNumber(payload.indicators?.latestSma20),
    },
    {
      section: "Technical Indicators",
      field: "Latest SMA50",
      value: formatNumber(payload.indicators?.latestSma50),
    },

    {
      section: "Market Sentiment",
      field: "Overall Label",
      value: payload.sentiment?.label ?? "",
    },
    {
      section: "Market Sentiment",
      field: "Score",
      value: formatNumber(payload.sentiment?.score),
    },
    {
      section: "Market Sentiment",
      field: "Confidence",
      value: formatPercent(payload.sentiment?.confidence),
    },
    {
      section: "Market Sentiment",
      field: "Source",
      value: payload.sentiment?.provider ?? "",
    },
    {
      section: "Market Sentiment",
      field: "Status",
      value: payload.sentiment?.status ?? "",
    },
    {
      section: "Market Sentiment",
      field: "Warning",
      value: payload.sentiment?.warning ?? "",
    },

    {
      section: "Prediction",
      field: "Risk Profile",
      value: payload.prediction?.riskProfile ?? "",
    },
    {
      section: "Prediction",
      field: "Horizon",
      value: payload.prediction?.horizon ?? "",
    },
    {
      section: "Prediction",
      field: "Trend",
      value: payload.prediction?.trend ?? "",
    },
    {
      section: "Prediction",
      field: "Prediction Confidence",
      value: formatPercent(payload.prediction?.confidence),
    },
    {
      section: "Prediction",
      field: "Sentiment Label",
      value: payload.prediction?.sentimentLabel ?? "",
    },
    {
      section: "Prediction",
      field: "Sentiment Score",
      value: formatNumber(payload.prediction?.sentimentScore),
    },
    {
      section: "Prediction",
      field: "Interpretation",
      value: payload.prediction?.interpretation ?? "",
    },
    {
      section: "Prediction",
      field: "Suggested Action",
      value: payload.prediction?.suggestedAction ?? "",
    },
    {
      section: "Prediction",
      field: "Action Reason",
      value: payload.prediction?.actionReason ?? "",
    },
    {
      section: "Prediction",
      field: "Explanation",
      value: payload.prediction?.explanation ?? "",
    },
    {
      section: "Prediction",
      field: "Risk Message",
      value: payload.prediction?.riskMessage ?? "",
    },
  ]);

  styleHeaderRow(summarySheet);
  styleBodyBorders(summarySheet);
  styleAlternatingRows(summarySheet);
  applyTrendColor(summarySheet);
  autoFitColumns(summarySheet);

  const historySheet = workbook.addWorksheet("Historical Data");
  historySheet.columns = [
    { header: "Date", key: "date", width: 22 },
    { header: "Close", key: "close", width: 14 },
  ];

  (payload.history ?? []).forEach((point) => {
    historySheet.addRow({
      date: point.date ?? "",
      close: point.close == null ? "" : Number(point.close.toFixed(2)),
    });
  });

  styleHeaderRow(historySheet);
  styleBodyBorders(historySheet);
  styleAlternatingRows(historySheet);
  autoFitColumns(historySheet);

  const indicatorsSheet = workbook.addWorksheet("Indicator Series");
  indicatorsSheet.columns = [
    { header: "Timestamp", key: "timestamp", width: 22 },
    { header: "Close", key: "close", width: 14 },
    { header: "SMA20", key: "sma20", width: 14 },
    { header: "SMA50", key: "sma50", width: 14 },
    { header: "RSI14", key: "rsi14", width: 14 },
  ];

  const timestamps = payload.indicators?.timestamps ?? [];
  const close = payload.indicators?.close ?? [];
  const sma20 = payload.indicators?.sma20 ?? [];
  const sma50 = payload.indicators?.sma50 ?? [];
  const rsi14 = payload.indicators?.rsi14 ?? [];

  const maxLen = Math.max(
    timestamps.length,
    close.length,
    sma20.length,
    sma50.length,
    rsi14.length
  );

  for (let i = 0; i < maxLen; i += 1) {
    indicatorsSheet.addRow({
      timestamp: timestamps[i] ?? "",
      close: close[i] == null ? "" : Number(close[i]!.toFixed(2)),
      sma20: sma20[i] == null ? "" : Number(sma20[i]!.toFixed(2)),
      sma50: sma50[i] == null ? "" : Number(sma50[i]!.toFixed(2)),
      rsi14: rsi14[i] == null ? "" : Number(rsi14[i]!.toFixed(2)),
    });
  }

  styleHeaderRow(indicatorsSheet);
  styleBodyBorders(indicatorsSheet);
  styleAlternatingRows(indicatorsSheet);
  autoFitColumns(indicatorsSheet);

  const sentimentSheet = workbook.addWorksheet("Sentiment News");
  sentimentSheet.columns = [
    { header: "Title", key: "title", width: 50 },
    { header: "Publisher", key: "publisher", width: 20 },
    { header: "Score", key: "score", width: 12 },
    { header: "Published At", key: "publishedAt", width: 24 },
    { header: "URL", key: "url", width: 55 },
    { header: "Image URL", key: "imageUrl", width: 55 },
  ];

  (payload.sentiment?.items ?? []).forEach((item) => {
    sentimentSheet.addRow({
      title: item.title ?? "",
      publisher: item.publisher ?? "",
      score: item.score == null ? "" : Number(item.score.toFixed(2)),
      publishedAt: item.publishedAt ?? "",
      url: item.url ?? "",
      imageUrl: item.imageUrl ?? "",
    });
  });

  styleHeaderRow(sentimentSheet);
  styleBodyBorders(sentimentSheet);
  styleAlternatingRows(sentimentSheet);
  autoFitColumns(sentimentSheet);

  const predictionSheet = workbook.addWorksheet("Prediction Details");
  predictionSheet.columns = [
    { header: "Field", key: "field", width: 24 },
    { header: "Value", key: "value", width: 90 },
  ];

  predictionSheet.addRows([
    { field: "Risk Profile", value: payload.prediction?.riskProfile ?? "" },
    { field: "Horizon", value: payload.prediction?.horizon ?? "" },
    { field: "Trend", value: payload.prediction?.trend ?? "" },
    {
      field: "Confidence",
      value: formatPercent(payload.prediction?.confidence),
    },
    {
      field: "Sentiment Label",
      value: payload.prediction?.sentimentLabel ?? "",
    },
    {
      field: "Sentiment Score",
      value: formatNumber(payload.prediction?.sentimentScore),
    },
    {
      field: "Interpretation",
      value: payload.prediction?.interpretation ?? "",
    },
    {
      field: "Suggested Action",
      value: payload.prediction?.suggestedAction ?? "",
    },
    {
      field: "Action Reason",
      value: payload.prediction?.actionReason ?? "",
    },
    {
      field: "Explanation",
      value: payload.prediction?.explanation ?? "",
    },
    {
      field: "Risk Message",
      value: payload.prediction?.riskMessage ?? "",
    },
  ]);

  styleHeaderRow(predictionSheet);
  styleBodyBorders(predictionSheet);
  styleAlternatingRows(predictionSheet);
  autoFitColumns(predictionSheet);

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  });

  saveAs(
    blob,
    `${payload.ticker}-report-${new Date().toISOString().slice(0, 10)}.xlsx`
  );
}