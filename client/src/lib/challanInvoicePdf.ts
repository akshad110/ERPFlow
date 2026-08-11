import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import type { Challan } from "@/types/challan.types";

const BRAND = {
  dark: [31, 111, 95] as [number, number, number],
  mid: [47, 160, 132] as [number, number, number],
  soft: [231, 244, 238] as [number, number, number],
  ink: [20, 53, 47] as [number, number, number],
  muted: [90, 120, 112] as [number, number, number],
  line: [183, 217, 203] as [number, number, number],
};

function formatDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "-";
  return date.toLocaleDateString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

/** ASCII-safe money for jsPDF Helvetica (avoids broken INR/rupee glyphs). */
function formatMoney(value: number) {
  const amount = Number.isFinite(value) ? value : 0;
  const formatted = new Intl.NumberFormat("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount);
  return `Rs. ${formatted}`;
}

function safeText(value?: string | null, fallback = "-") {
  const trimmed = value?.trim();
  return trimmed ? trimmed : fallback;
}

/**
 * Generate and download a sales invoice PDF for a challan.
 */
export function downloadChallanInvoicePdf(challan: Challan) {
  const items = challan.items ?? [];
  const doc = new jsPDF({ unit: "mm", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 14;
  const contentWidth = pageWidth - margin * 2;

  // Header band
  doc.setFillColor(...BRAND.dark);
  doc.rect(0, 0, pageWidth, 28, "F");
  doc.setFillColor(...BRAND.mid);
  doc.rect(0, 28, pageWidth, 2, "F");

  doc.setTextColor(255, 255, 255);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(18);
  doc.text("ERPFlow", margin, 14);
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text("Wholesale operations | Tax invoice / Delivery challan", margin, 21);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(11);
  doc.text(challan.challanNumber, pageWidth - margin, 14, { align: "right" });
  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.text(`Status: ${challan.status}`, pageWidth - margin, 21, {
    align: "right",
  });

  let y = 40;

  doc.setTextColor(...BRAND.ink);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(10);
  doc.text("Invoice details", margin, y);
  y += 6;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  const metaLeft = [
    `Date: ${formatDate(challan.createdAt)}`,
    `Prepared by: ${safeText(challan.createdByName, "System")}`,
  ];
  const metaRight = [
    `Total qty: ${challan.totalQuantity}`,
    `Lines: ${items.length}`,
  ];
  metaLeft.forEach((line, i) => doc.text(line, margin, y + i * 5));
  metaRight.forEach((line, i) =>
    doc.text(line, pageWidth - margin, y + i * 5, { align: "right" })
  );
  y += 16;

  const billLines: string[] = [];
  if (challan.businessName) billLines.push(challan.businessName);
  if (challan.customerGstNumber)
    billLines.push(`GSTIN: ${challan.customerGstNumber}`);
  if (challan.customerMobile) billLines.push(`Mobile: ${challan.customerMobile}`);
  if (challan.customerEmail) billLines.push(`Email: ${challan.customerEmail}`);
  if (challan.customerAddress) billLines.push(challan.customerAddress);

  const billBoxHeight = Math.max(28, 18 + billLines.length * 4.2);
  doc.setDrawColor(...BRAND.line);
  doc.setFillColor(...BRAND.soft);
  doc.roundedRect(margin, y, contentWidth, billBoxHeight, 2, 2, "FD");

  doc.setTextColor(...BRAND.dark);
  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.text("BILL TO", margin + 4, y + 6.5);

  doc.setTextColor(...BRAND.ink);
  doc.setFontSize(11);
  doc.text(safeText(challan.customerName, "Customer"), margin + 4, y + 13, {
    maxWidth: contentWidth - 8,
  });

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8);
  doc.setTextColor(...BRAND.muted);
  billLines.forEach((line, i) => {
    doc.text(line, margin + 4, y + 18.5 + i * 4.2, {
      maxWidth: contentWidth - 8,
    });
  });

  y += billBoxHeight + 8;

  const valueTotal = items.reduce(
    (sum, item) => sum + Number(item.totalPrice),
    0
  );

  autoTable(doc, {
    startY: y,
    head: [["#", "Product", "SKU", "Qty", "Unit price (INR)", "Amount (INR)"]],
    body: items.map((item, index) => [
      String(index + 1),
      item.productName,
      item.sku,
      String(item.quantity),
      formatMoney(Number(item.unitPrice)),
      formatMoney(Number(item.totalPrice)),
    ]),
    styles: {
      font: "helvetica",
      fontSize: 8,
      textColor: BRAND.ink,
      lineColor: BRAND.line,
      lineWidth: 0.2,
      cellPadding: { top: 2.2, right: 2, bottom: 2.2, left: 2 },
      overflow: "linebreak",
      valign: "middle",
    },
    headStyles: {
      fillColor: BRAND.dark,
      textColor: [255, 255, 255],
      fontStyle: "bold",
      fontSize: 7.5,
      overflow: "linebreak",
      valign: "middle",
    },
    alternateRowStyles: {
      fillColor: [247, 252, 249],
    },
    columnStyles: {
      0: { cellWidth: 9, halign: "center" },
      1: { cellWidth: "auto", halign: "left" },
      2: { cellWidth: 24, halign: "left", overflow: "ellipsize" },
      3: { cellWidth: 14, halign: "right" },
      4: { cellWidth: 32, halign: "right" },
      5: { cellWidth: 34, halign: "right" },
    },
    margin: { left: margin, right: margin },
    tableWidth: contentWidth,
  });

  const tableEndY =
    (doc as jsPDF & { lastAutoTable?: { finalY: number } }).lastAutoTable
      ?.finalY ?? y + 20;

  let summaryY = tableEndY + 8;
  const boxWidth = 78;
  const boxX = pageWidth - margin - boxWidth;
  const boxPad = 4;

  doc.setFillColor(...BRAND.soft);
  doc.setDrawColor(...BRAND.line);
  doc.roundedRect(boxX, summaryY, boxWidth, 26, 2, 2, "FD");

  const amountX = boxX + boxWidth - boxPad;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.muted);
  doc.text("Subtotal", boxX + boxPad, summaryY + 9);
  doc.text("Grand total", boxX + boxPad, summaryY + 19);

  doc.setFont("helvetica", "bold");
  doc.setFontSize(8.5);
  doc.setTextColor(...BRAND.ink);
  doc.text(formatMoney(valueTotal), amountX, summaryY + 9, { align: "right" });
  doc.setTextColor(...BRAND.dark);
  doc.setFontSize(10);
  doc.text(formatMoney(valueTotal), amountX, summaryY + 19, {
    align: "right",
  });

  summaryY += 36;
  doc.setDrawColor(...BRAND.line);
  doc.line(margin, summaryY, pageWidth - margin, summaryY);
  summaryY += 7;

  doc.setFont("helvetica", "normal");
  doc.setFontSize(7.5);
  doc.setTextColor(...BRAND.muted);
  doc.text(
    "Generated by ERPFlow. Prices and quantities are snapshotted from the challan at export time. Amounts shown in INR.",
    margin,
    summaryY,
    { maxWidth: contentWidth }
  );
  summaryY += 7;
  doc.text("Thank you for your business.", margin, summaryY);

  const fileSafe = challan.challanNumber.replace(/[^\w.-]+/g, "_");
  doc.save(`${fileSafe}-invoice.pdf`);
}
