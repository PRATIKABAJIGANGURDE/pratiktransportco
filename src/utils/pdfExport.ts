import { TransportEntry } from "@/types/transport";
import { format } from "date-fns";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
declare module "jspdf" {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export const exportToPDF = (entries: TransportEntry[], startDate: Date, endDate: Date) => {
  const doc = new jsPDF();

  // ========== Calculate Summary ==========
  const totalAmount = entries.reduce((sum, entry) => sum + entry.rentAmount, 0);
  const paidAmount = entries
    .filter(entry => entry.balanceStatus === "PAID")
    .reduce((sum, entry) => sum + entry.rentAmount, 0);
  const unpaidAmount = entries
    .filter(entry => entry.balanceStatus !== "PAID")
    .reduce((sum, entry) => sum + (entry.rentAmount - (entry.advanceAmount || 0)), 0);
  const averageAmount = entries.length ? totalAmount / entries.length : 0;
  const uniqueVehicles = new Set(entries.map(e => e.vehicleNumber)).size;
  const uniqueWeights = new Set(entries.map(e => e.weight).filter(Boolean)).size;

  // ========== Document Title ==========
  doc.setFontSize(22);
  doc.setTextColor(41, 128, 185);
  doc.text("Transport Entries Report", 14, 20);

  // ========== Date Range ==========
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(`Period: ${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`, 14, 30);

  // ========== Summary Table ==========
  let yPos = 40;
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.text("Summary Statistics", 14, yPos);

  const summaryStats = [
    { label: "Total Entries", value: entries.length },
    { label: "Total Amount", value: `₹${totalAmount.toLocaleString()}` },
    { label: "Paid Amount", value: `₹${paidAmount.toLocaleString()}` },
    { label: "Unpaid Amount", value: `₹${unpaidAmount.toLocaleString()}` },
    { label: "Average Amount", value: `₹${Math.round(averageAmount).toLocaleString()}` },
    { label: "Unique Vehicles", value: uniqueVehicles },
    { label: "Unique Weights", value: uniqueWeights },
  ];

  (doc as any).autoTable({
    startY: yPos + 5,
    head: [["Metric", "Value"]],
    body: summaryStats.map(item => [item.label, item.value.toString()]),
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 11 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  });

  // ========== Status Distribution ==========
  const statusDistribution = entries.reduce((acc, entry) => {
    acc[entry.balanceStatus] = (acc[entry.balanceStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.text("Status Distribution", 14, yPos);

  (doc as any).autoTable({
    startY: yPos + 5,
    head: [["Status", "Count", "Percentage"]],
    body: Object.entries(statusDistribution).map(([status, count]) => [
      status,
      count,
      `${((count / entries.length) * 100).toFixed(1)}%`,
    ]),
    theme: "grid",
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 10 },
    styles: { fontSize: 9, cellPadding: 2 },
    margin: { left: 14, right: 14 },
    tableWidth: 'auto',
  });

  // ========== Detailed Entries Table ==========
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setTextColor(41, 128, 185);
  doc.text("Detailed Entries", 14, yPos);

  const entriesData = entries.map((entry) => [
    format(new Date(entry.date), "dd/MM/yyyy"),
    entry.vehicleNumber || "-",
    entry.weight || "-",
    entry.transportName || "-",
    entry.place || "-",
    `₹${entry.rentAmount.toLocaleString()}`,
    entry.advanceAmount ? `₹${entry.advanceAmount.toLocaleString()}` : "-",
    `₹${(entry.rentAmount - (entry.advanceAmount || 0)).toLocaleString()}`,
    entry.balanceStatus || "-",
    entry.balanceDate ? format(new Date(entry.balanceDate), "dd/MM/yyyy") : "-",
  ]);

  (doc as any).autoTable({
    startY: yPos + 5,
    head: [[
      "Date",
      "Vehicle",
      "Weight",
      "Transport",
      "Place",
      "Rent",
      "Advance",
      "Balance",
      "Status",
      "Paid Date"
    ]],
    body: entriesData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontSize: 8 },
    columnStyles: {
      5: { halign: "right", cellWidth: 22 },
      6: { halign: "right", cellWidth: 22 },
      7: { halign: "right", cellWidth: 22 },
    },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
  });

  // ========== Save PDF ==========
  doc.save(`transport-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
