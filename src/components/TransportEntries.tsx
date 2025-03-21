
import { format } from "date-fns";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { TransportEntry } from "@/types/transport";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { AlertCircle, Download, Edit, FileSpreadsheet, MoreHorizontal, Plus, Search, Trash, Truck, Wallet, Calendar } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { toast } from "@/hooks/use-toast";
import { exportToExcel } from "@/utils/excelExport";
import { Card, CardContent } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface TransportEntriesProps {
  entries: TransportEntry[];
  onDelete: (id: string) => void;
}

const TransportEntries = ({ entries, onDelete }: TransportEntriesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("ALL");
  const [sortBy, setSortBy] = useState<"date" | "amount" | "balance">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const navigate = useNavigate();
  
  // Calculate statistics
  const totalEntries = entries.length;
  const unpaidEntries = entries.filter(e => e.balanceStatus !== "PAID").length;
  const thisMonthEntries = entries.filter(e => {
    const today = new Date();
    const entryDate = new Date(e.date);
    return entryDate.getMonth() === today.getMonth() && 
           entryDate.getFullYear() === today.getFullYear();
  }).length;

  // Calculate remaining balance
  const remainingBalance = entries.reduce((total, entry) => {
    if (entry.balanceStatus !== "PAID") {
      return total + (entry.rentAmount - (entry.advanceAmount || 0));
    }
    return total;
  }, 0);

  const filteredEntries = entries
    .filter(entry => 
      (entry.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.weight.toLowerCase().includes(searchTerm.toLowerCase()) || // Changed from driverName
      entry.place.toLowerCase().includes(searchTerm.toLowerCase()) ||
      entry.transportName.toLowerCase().includes(searchTerm.toLowerCase())) &&
      (statusFilter === "ALL" || entry.balanceStatus === statusFilter)
    )
    .sort((a, b) => {
      if (sortBy === "date") {
        return sortOrder === "asc" 
          ? new Date(a.date).getTime() - new Date(b.date).getTime()
          : new Date(b.date).getTime() - new Date(a.date).getTime();
      } else if (sortBy === "amount") {
        return sortOrder === "asc"
          ? a.rentAmount - b.rentAmount
          : b.rentAmount - a.rentAmount;
      } else {
        const balanceA = a.rentAmount - (a.advanceAmount || 0);
        const balanceB = b.rentAmount - (b.advanceAmount || 0);
        return sortOrder === "asc"
          ? balanceA - balanceB
          : balanceB - balanceA;
      }
    });

  const handleExport = () => {
    if (filteredEntries.length === 0) {
      toast({
        title: "No entries to export",
        description: "Add some entries first before exporting.",
        variant: "destructive"
      });
      return;
    }
    
    exportToExcel(filteredEntries);
    toast({
      title: "Export successful",
      description: "Your transport entries have been exported to Excel.",
    });
  };

  const handleAddNew = () => {
    navigate('/add-entry');
  };

  const handleEdit = (id: string) => {
    navigate(`/edit-entry/${id}`);
  };

  const handleDelete = (id: string) => {
    onDelete(id);
    toast({
      title: "Entry deleted",
      description: "The transport entry has been successfully deleted.",
    });
  };

  if (entries.length === 0) {
    return (
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div></div>
          <Button 
            onClick={handleAddNew}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add New Entry
          </Button>
        </div>
        
        <Alert className="bg-amber-50 border-amber-200">
          <AlertCircle className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-700">No entries yet</AlertTitle>
          <AlertDescription className="text-amber-600">
            You haven't created any transport entries yet. Use the Add New Entry button to create your first entry.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Total Entries</p>
                <p className="text-2xl font-bold text-slate-900">{totalEntries}</p>
              </div>
              <div className="p-2 bg-primary/10 rounded-full">
                <Truck className="h-4 w-4 text-primary" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">Unpaid Entries</p>
                <p className="text-2xl font-bold text-red-600">{unpaidEntries}</p>
              </div>
              <div className="p-2 bg-red-100 rounded-full">
                <AlertCircle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-slate-600">This Month</p>
                <p className="text-2xl font-bold text-blue-600">{thisMonthEntries}</p>
              </div>
              <div className="p-2 bg-blue-100 rounded-full">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Remaining Balance Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-primary/80">Remaining Balance</h3>
              <p className="text-2xl font-bold text-primary">₹{remainingBalance.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-primary/60">Total Unpaid Amount</p>
              <p className="text-sm text-primary/80">Across all entries</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search and Actions */}
      <div className="flex flex-col sm:flex-row justify-between gap-2 items-center">
        <div className="flex gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-none">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <Input 
              placeholder="Search entries..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 w-full"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Status</SelectItem>
              <SelectItem value="PAID">Paid</SelectItem>
              <SelectItem value="UNPAID">Unpaid</SelectItem>
              <SelectItem value="PARTIAL">Partial</SelectItem>
            </SelectContent>
          </Select>
          <Select value={sortBy} onValueChange={(value: "date" | "amount" | "balance") => setSortBy(value)}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="amount">Amount</SelectItem>
              <SelectItem value="balance">Balance</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="icon"
            onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
          >
            {sortOrder === "asc" ? "↑" : "↓"}
          </Button>
        </div>
        
        <div className="flex gap-2">
          <Button 
            onClick={handleExport}
            variant="outline"
            className="gap-2"
          >
            <FileSpreadsheet className="h-4 w-4" /> Export Excel
          </Button>
          
          <Button 
            onClick={handleAddNew}
            className="gap-2"
          >
            <Plus className="h-4 w-4" /> Add New Entry
          </Button>
        </div>
      </div>

      {/* Table */}
      <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
        <ScrollArea className="h-[500px]">
          <div className="min-w-[1200px]">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="font-semibold">Date</TableHead>
                  <TableHead className="font-semibold">Vehicle Number</TableHead>
                  <TableHead className="font-semibold">Weight of Goods</TableHead> {/* Changed from Driver */}
                  <TableHead className="font-semibold">Transport Name</TableHead>
                  <TableHead className="font-semibold">Place</TableHead>
                  <TableHead className="font-semibold text-right">Rent Amount</TableHead>
                  <TableHead className="font-semibold text-right">Advance</TableHead>
                  <TableHead className="font-semibold text-right">Balance</TableHead>
                  <TableHead className="font-semibold">Balance Paid Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEntries.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={11} className="text-center py-8 text-slate-500">
                      No entries found matching your search.
                    </TableCell>
                  </TableRow>
                ) : (
                  filteredEntries.map((entry) => (
                    <TableRow 
                      key={entry.id}
                      className="group"
                    >
                      <TableCell>{format(new Date(entry.date), "dd/MM/yyyy")}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Truck className="h-3.5 w-3.5 text-slate-400" />
                          {entry.vehicleNumber}
                        </div>
                      </TableCell>
                      <TableCell>{entry.weight || "—"}</TableCell> {/* Changed from driverName */}
                      <TableCell>{entry.transportName || "—"}</TableCell>
                      <TableCell>{entry.place || "—"}</TableCell>
                      <TableCell className="text-right">₹{entry.rentAmount.toLocaleString()}</TableCell>
                      <TableCell className="text-right">
                        {entry.advanceAmount ? `₹${entry.advanceAmount.toLocaleString()}` : "—"}
                      </TableCell>
                      <TableCell className="text-right">
                        ₹{(entry.rentAmount - (entry.advanceAmount || 0)).toLocaleString()}
                      </TableCell>
                      <TableCell>
                        {entry.balanceDate ? format(new Date(entry.balanceDate), "dd/MM/yyyy") : "—"}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant={
                            entry.balanceStatus === "PAID" 
                              ? "default" 
                              : entry.balanceStatus === "PARTIAL" 
                                ? "outline" 
                                : "destructive"
                          }
                          className={
                            entry.balanceStatus === "PAID" 
                              ? "bg-green-100 text-green-800 hover:bg-green-200" 
                              : entry.balanceStatus === "PARTIAL" 
                                ? "bg-amber-100 text-amber-800 border-amber-300 hover:bg-amber-200" 
                                : "bg-red-100 text-red-800 hover:bg-red-200"
                          }
                        >
                          {entry.balanceStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="opacity-0 group-hover:opacity-100">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(entry.id)}>
                              <Edit className="mr-2 h-4 w-4" /> Edit
                            </DropdownMenuItem>
                            <Dialog>
                              <DialogTrigger asChild>
                                <DropdownMenuItem onSelect={(e) => e.preventDefault()}>
                                  <Trash className="mr-2 h-4 w-4" /> Delete
                                </DropdownMenuItem>
                              </DialogTrigger>
                              <DialogContent>
                                <DialogHeader>
                                  <DialogTitle>Confirm deletion</DialogTitle>
                                  <DialogDescription>
                                    Are you sure you want to delete this entry? This action cannot be undone.
                                  </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                  <DialogClose asChild>
                                    <Button variant="outline">Cancel</Button>
                                  </DialogClose>
                                  <DialogClose asChild>
                                    <Button 
                                      variant="destructive" 
                                      onClick={() => handleDelete(entry.id)}
                                    >
                                      Delete
                                    </Button>
                                  </DialogClose>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </ScrollArea>
      </div>
    </div>
  );
};

export default TransportEntries;
