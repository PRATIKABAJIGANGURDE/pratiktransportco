import { TransportEntry } from "@/types/transport";
import { format } from "date-fns";
import jsPDF from "jspdf";
import 'jspdf-autotable';

// Extend jsPDF type to include autoTable
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => void;
  }
}

export const exportToPDF = (entries: TransportEntry[], startDate: Date, endDate: Date) => {
  const doc = new jsPDF();

  const mainColor = [41, 128, 185]; // Blue
  const unpaidColor = [255, 0, 0]; // Red

  // Calculate statistics
  const totalAmount = entries.reduce((sum, entry) => sum + entry.rentAmount, 0);
  const unpaidAmount = entries
    .filter(entry => entry.balanceStatus !== "PAID")
    .reduce((sum, entry) => sum + (entry.rentAmount - (entry.advanceAmount || 0)), 0);
  const paidAmount = entries
    .filter(entry => entry.balanceStatus === "PAID")
    .reduce((sum, entry) => sum + entry.rentAmount, 0);
  const averageAmount = entries.length > 0 ? totalAmount / entries.length : 0;
  const uniqueVehicles = new Set(entries.map(entry => entry.vehicleNumber)).size;
  const uniqueWeights = new Set(entries.map(entry => entry.weight).filter(Boolean)).size;

  // Title
  doc.setFontSize(20);
  doc.setTextColor(...mainColor);
  doc.text("Transport Entries Report", 14, 20);

  // Date Range
  doc.setFontSize(12);
  doc.setTextColor(100);
  doc.text(
    `Period: ${format(startDate, "dd MMM yyyy")} - ${format(endDate, "dd MMM yyyy")}`,
    14,
    30
  );

  // Summary Statistics
  let yPos = 40;
  doc.setFontSize(16);
  doc.setTextColor(...mainColor);
  doc.text("Summary Statistics", 14, yPos);

  doc.setFontSize(10);
  doc.setTextColor(60);
  yPos += 10;

  const summaryStats = [
    { label: "Total Entries", value: entries.length.toString(), highlight: false },
    { label: "Total Amount", value: `Rs. ${totalAmount.toLocaleString()}`, highlight: false },
    { label: "Paid Amount", value: `Rs. ${paidAmount.toLocaleString()}`, highlight: false },
    { label: "Unpaid Amount", value: `Rs. ${unpaidAmount.toLocaleString()}`, highlight: true },  // Highlighted
    { label: "Average Amount", value: `Rs. ${Math.round(averageAmount).toLocaleString()}`, highlight: false },
    { label: "Unique Vehicles", value: uniqueVehicles.toString(), highlight: false },
    { label: "Unique Weights", value: uniqueWeights.toString(), highlight: false },
  ];

  const summaryBody = summaryStats.map(stat => {
    if (stat.highlight) {
      return [
        { content: stat.label, styles: { textColor: unpaidColor, fontStyle: 'bold' } },
        { content: stat.value, styles: { textColor: unpaidColor, fontStyle: 'bold' } }
      ];
    } else {
      return [stat.label, stat.value];
    }
  });

  (doc as any).autoTable({
    startY: yPos,
    head: [["Metric", "Value"]],
    body: summaryBody,
    theme: "grid",
    headStyles: {
      fillColor: mainColor,
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: 14 },
    tableWidth: 180,
  });

  // Status Distribution
  const statusDistribution = entries.reduce((acc, entry) => {
    acc[entry.balanceStatus] = (acc[entry.balanceStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setTextColor(...mainColor);
  doc.text("Status Distribution", 14, yPos);

  (doc as any).autoTable({
    startY: yPos + 5,
    head: [["Status", "Count", "Percentage"]],
    body: Object.entries(statusDistribution).map(([status, count]) => [
      status,
      count,
      `${Math.round((count / entries.length) * 100)}%`,
    ]),
    theme: "grid",
    headStyles: {
      fillColor: mainColor,
      textColor: 255,
      fontSize: 10,
      fontStyle: "bold",
    },
    styles: {
      fontSize: 9,
      cellPadding: 3,
    },
    margin: { left: 14 },
    tableWidth: 180,
  });

  // Detailed Entries
  yPos = (doc as any).lastAutoTable.finalY + 15;
  doc.setFontSize(16);
  doc.setTextColor(...mainColor);
  doc.text("Detailed Entries", 14, yPos);

  const tableData = entries.map((entry) => [
    format(new Date(entry.date), "dd/MM/yyyy"),
    entry.vehicleNumber,
    entry.weight || "-",
    entry.transportName || "-",
    entry.place || "-",
    `Rs. ${entry.rentAmount.toLocaleString()}`,
    entry.advanceAmount ? `Rs. ${entry.advanceAmount.toLocaleString()}` : "-",
    `Rs. ${(entry.rentAmount - (entry.advanceAmount || 0)).toLocaleString()}`,
    entry.balanceStatus,
    entry.balanceDate ? format(new Date(entry.balanceDate), "dd/MM/yyyy") : "-",
  ]);

  (doc as any).autoTable({
    startY: yPos + 5,
    head: [
      [
        "Date",
        "Vehicle",
        "Weight",
        "Transport",
        "Place",
        "Rent",
        "Advance",
        "Balance",
        "Status",
        "Paid Date",
      ],
    ],
    body: tableData,
    theme: "grid",
    styles: {
      fontSize: 8,
      cellPadding: 2,
      overflow: 'linebreak',
    },
    columnStyles: {
      5: { halign: 'right', cellWidth: 20 },
      6: { halign: 'right', cellWidth: 20 },
      7: { halign: 'right', cellWidth: 20 },
    },
    headStyles: {
      fillColor: mainColor,
      textColor: 255,
      fontSize: 8,
      fontStyle: "bold",
    },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
  });

  // Save PDF
  doc.save(`transport-report-${format(new Date(), "yyyy-MM-dd")}.pdf`);
};
