"use client";

import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

const YEARS = Array.from({ length: 31 }, (_, i) => 2020 + i);

export function ImportExportDialog({ open, onOpenChange }: ImportExportDialogProps) {
  const currentDate = new Date();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startMonth, setStartMonth] = useState(currentDate.getMonth());
  const [startYear, setStartYear] = useState(currentDate.getFullYear());
  const [endMonth, setEndMonth] = useState(currentDate.getMonth());
  const [endYear, setEndYear] = useState(currentDate.getFullYear());

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = () => {
    // Import functionality will be implemented later
    console.log("Import file:", selectedFile);
  };

  const handleExport = () => {
    // Export functionality will be implemented later
    console.log("Export range:", {
      startMonth,
      startYear,
      endMonth,
      endYear,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[480px]">
        <DialogHeader>
          <DialogTitle>Power Uptime</DialogTitle>
        </DialogHeader>

        <Tabs defaultValue="import" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="import" className="flex-1">
              Import
            </TabsTrigger>
            <TabsTrigger value="export" className="flex-1">
              Export
            </TabsTrigger>
          </TabsList>

          <TabsContent value="import" className="space-y-4 pt-4">
            <div className="space-y-2">
              <Label htmlFor="file-upload">Upload CSV File</Label>
              <Input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                className="cursor-pointer file:bg-gray-100 file:border-0 file:mr-4 file:py-2 file:px-4 file:rounded file:cursor-pointer file:text-sm file:font-medium"
              />
              {selectedFile && (
                <p className="text-sm text-gray-600">
                  Selected file: {selectedFile.name}
                </p>
              )}
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleImport}
                disabled={!selectedFile}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Import
              </Button>
            </div>
          </TabsContent>

          <TabsContent value="export" className="space-y-4 pt-4">
            <div className="space-y-4">
              <div>
                <Label className="mb-2 block">Select Date Range</Label>
                <div className="flex items-center gap-2">
                  <Select
                    value={startMonth.toString()}
                    onValueChange={(value) => setStartMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={startYear.toString()}
                    onValueChange={(value) => setStartYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <span className="text-gray-500">-</span>

                  <Select
                    value={endMonth.toString()}
                    onValueChange={(value) => setEndMonth(parseInt(value))}
                  >
                    <SelectTrigger className="w-28">
                      <SelectValue placeholder="Month" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {MONTHS.map((month, index) => (
                        <SelectItem key={index} value={index.toString()}>
                          {month}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select
                    value={endYear.toString()}
                    onValueChange={(value) => setEndYear(parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue placeholder="Year" />
                    </SelectTrigger>
                    <SelectContent className="max-h-64">
                      {YEARS.map((year) => (
                        <SelectItem key={year} value={year.toString()}>
                          {year}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            <div className="pt-4 flex gap-2">
              <Button
                onClick={() => onOpenChange(false)}
                variant="outline"
                className="flex-1"
              >
                Cancel
              </Button>
              <Button
                onClick={handleExport}
                className="flex-1 bg-orange-500 hover:bg-orange-600"
              >
                Export
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
