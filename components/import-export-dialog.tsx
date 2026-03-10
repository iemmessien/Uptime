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
import { toast } from "sonner";

interface ImportExportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
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

export function ImportExportDialog({ open, onOpenChange, onSuccess }: ImportExportDialogProps) {
  const currentDate = new Date();
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [startMonth, setStartMonth] = useState(currentDate.getMonth());
  const [startYear, setStartYear] = useState(currentDate.getFullYear());
  const [endMonth, setEndMonth] = useState(currentDate.getMonth());
  const [endYear, setEndYear] = useState(currentDate.getFullYear());
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      toast.error("Please select a file to import");
      return;
    }

    setIsImporting(true);
    try {
      console.log('Starting import with file:', selectedFile.name);

      // Create FormData to send the file
      const formData = new FormData();
      formData.append('file', selectedFile);

      console.log('Uploading file to /uptime/api/uptime/import');

      // Upload the file to the import API
      const response = await fetch('/uptime/api/uptime/import', {
        method: 'POST',
        body: formData,
      });

      console.log('Response status:', response.status);

      const result = await response.json();

      if (!response.ok || !result.success) {
        console.error('Import failed:', result);
        toast.error(result.error || 'Failed to import uptimes');
        setIsImporting(false);
        return;
      }

      console.log('Import successful:', result);
      toast.success(result.message || 'Uptimes imported successfully');
      
      // Call onSuccess callback if provided
      if (onSuccess) {
        onSuccess();
      }
      
      // Clear the selected file
      setSelectedFile(null);
      
      // Reset file input
      const fileInput = document.getElementById('file-upload') as HTMLInputElement;
      if (fileInput) {
        fileInput.value = '';
      }
    } catch (error) {
      console.error('Error importing data:', error);
      toast.error('An error occurred while importing uptimes');
    } finally {
      setIsImporting(false);
    }
  };

  const handleExport = async () => {
    setIsExporting(true);
    try {
      console.log('Starting export with params:', { startMonth, startYear, endMonth, endYear });
      
      // Build the export URL with query parameters
      const url = `/uptime/api/uptime/export?startMonth=${startMonth}&startYear=${startYear}&endMonth=${endMonth}&endYear=${endYear}`;
      
      console.log('Fetching from URL:', url);
      
      // Fetch the CSV file
      const response = await fetch(url);
      
      console.log('Response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error("Failed to export data:", errorText);
        toast.error("Failed to export uptimes");
        setIsExporting(false);
        return;
      }

      // Get the blob from the response
      const blob = await response.blob();
      
      console.log('Blob size:', blob.size);
      
      // Extract filename from Content-Disposition header or use default
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'uptime-export.csv';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }

      console.log('Downloading file:', filename);

      // Create a download link and trigger the download
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);

      console.log("Export successful:", filename);
      toast.success("Uptimes exported successfully");
    } catch (error) {
      console.error("Error exporting data:", error);
      toast.error("An error occurred while exporting uptimes");
    } finally {
      setIsExporting(false);
    }
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

            <div className="pt-4">
              <Button
                onClick={handleImport}
                disabled={!selectedFile || isImporting}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isImporting ? "Importing..." : "Import"}
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

            <div className="pt-4">
              <Button
                onClick={handleExport}
                disabled={isExporting}
                className="w-full bg-orange-500 hover:bg-orange-600"
              >
                {isExporting ? "Exporting..." : "Export"}
              </Button>
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}
