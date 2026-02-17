// import React from "react";

// type Props = {
//   provider: "newsapi" | "yfinance" | "none";
//   status: "ok" | "rate_limited" | "error";
//   warning?: string;
// };

// function dotColor(status: Props["status"]) {
//   if (status === "ok") return "var(--green)";
//   if (status === "rate_limited") return "var(--yellow)";
//   return "var(--red)";
// }

// export default function ApiHealthBadge({ provider, status, warning }: Props) {
//   const label =
//     provider === "none" ? "No News Source" : `${provider.toUpperCase()} • ${status}`;

//   return (
//     <div
//       title={warning || ""}
//       style={{
//         display: "inline-flex",
//         alignItems: "center",
//         gap: 8,
//         padding: "6px 10px",
//         borderRadius: 999,
//         border: "1px solid rgba(255,255,255,0.10)",
//         background: "rgba(255,255,255,0.04)",
//         color: "var(--muted)",
//         fontSize: 12,
//       }}
//     >
//       <span
//         style={{
//           width: 8,
//           height: 8,
//           borderRadius: 999,
//           background: dotColor(status),
//           display: "inline-block",
//         }}
//       />
//       {label}
//     </div>
//   );
// }