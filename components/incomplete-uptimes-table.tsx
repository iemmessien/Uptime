"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check, MoreVertical, Trash2, CheckCircle, X } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { AddUptimeDialog } from "@/components/add-uptime-dialog";
import { toast } from "sonner";

interface IncompleteUptime {
  id: number;
  date: string;
  startTime: string;
  testRun: boolean;
  powers: string[];
}

function formatTime(timeString: string): string {
  const date = new Date(timeString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDate(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleDateString('en-US', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
}

// Helper to convert lowercase power keys to display names
function powerKeyToDisplayName(key: string): string {
  const mapping: Record<string, string> = {
    'ejigbo': 'Ejigbo',
    'isolo': 'Isolo',
    'gen1': 'G1',
    'gen2': 'G2',
    'gen3': 'G3',
    'gen4': 'G4',
    'gen5': 'G5',
    'gen6': 'G6',
    'gen7': 'G7',
    'gen8': 'G8',
    'gen9': 'G9',
    'gen10': 'G10',
    'gen11': 'G11',
    'gen12': 'G12',
  };
  return mapping[key] || key;
}

// Helper to convert display names to lowercase power keys
function displayNameToPowerKey(name: string): string {
  const mapping: Record<string, string> = {
    'Ejigbo': 'ejigbo',
    'Isolo': 'isolo',
    'G1': 'gen1',
    'G2': 'gen2',
    'G3': 'gen3',
    'G4': 'gen4',
    'G5': 'gen5',
    'G6': 'gen6',
    'G7': 'gen7',
    'G8': 'gen8',
    'G9': 'gen9',
    'G10': 'gen10',
    'G11': 'gen11',
    'G12': 'gen12',
  };
  return mapping[name] || name.toLowerCase();
}

const POWER_SUPPLIES = [
  'Ejigbo',
  'Isolo',
  'G1',
  'G2',
  'G3',
  'G4',
  'G5',
  'G6',
  'G7',
  'G8',
  'G9',
  'G10',
  'G11',
  'G12'
];

export function IncompleteUptimesTable({ refreshKey, onRefresh }: { refreshKey?: number; onRefresh?: () => void }) {
  const [incompleteUptimes, setIncompleteUptimes] = useState<IncompleteUptime[]>([]);
  const [loading, setLoading] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedUptime, setSelectedUptime] = useState<IncompleteUptime | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [uptimeToDelete, setUptimeToDelete] = useState<IncompleteUptime | null>(null);

  useEffect(() => {
    fetchIncompleteUptimes();
  }, [refreshKey]);

  const fetchIncompleteUptimes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/uptime/api/uptime/list?status=INCOMPLETE', {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache'
        }
      });
      
      if (!response.ok) {
        console.error("Failed to fetch incomplete uptimes");
        return;
      }

      const data = await response.json();
      
      // Group uptimes by date, startTime, and testRun to avoid duplicates
      const uptimeMap = new Map<string, IncompleteUptime>();
      
      data.uptimes?.forEach((uptime: any) => {
        // Create a unique key for each uptime event (date + startTime + testRun)
        const key = `${uptime.date}-${uptime.startTime}-${uptime.testRun}`;
        
        if (!uptimeMap.has(key)) {
          uptimeMap.set(key, {
            id: uptime.id,
            date: uptime.date,
            startTime: uptime.startTime,
            testRun: uptime.testRun,
            powers: []
          });
        }
        
        // Add the power supply to the powers array
        const uptimeGroup = uptimeMap.get(key)!;
        if (uptime.ejigboId && !uptimeGroup.powers.includes('ejigbo')) uptimeGroup.powers.push('ejigbo');
        if (uptime.isoloId && !uptimeGroup.powers.includes('isolo')) uptimeGroup.powers.push('isolo');
        if (uptime.gen1Id && !uptimeGroup.powers.includes('gen1')) uptimeGroup.powers.push('gen1');
        if (uptime.gen2Id && !uptimeGroup.powers.includes('gen2')) uptimeGroup.powers.push('gen2');
        if (uptime.gen3Id && !uptimeGroup.powers.includes('gen3')) uptimeGroup.powers.push('gen3');
        if (uptime.gen4Id && !uptimeGroup.powers.includes('gen4')) uptimeGroup.powers.push('gen4');
        if (uptime.gen5Id && !uptimeGroup.powers.includes('gen5')) uptimeGroup.powers.push('gen5');
        if (uptime.gen6Id && !uptimeGroup.powers.includes('gen6')) uptimeGroup.powers.push('gen6');
        if (uptime.gen7Id && !uptimeGroup.powers.includes('gen7')) uptimeGroup.powers.push('gen7');
        if (uptime.gen8Id && !uptimeGroup.powers.includes('gen8')) uptimeGroup.powers.push('gen8');
        if (uptime.gen9Id && !uptimeGroup.powers.includes('gen9')) uptimeGroup.powers.push('gen9');
        if (uptime.gen10Id && !uptimeGroup.powers.includes('gen10')) uptimeGroup.powers.push('gen10');
        if (uptime.gen11Id && !uptimeGroup.powers.includes('gen11')) uptimeGroup.powers.push('gen11');
        if (uptime.gen12Id && !uptimeGroup.powers.includes('gen12')) uptimeGroup.powers.push('gen12');
      });
      
      // Convert map to array and sort by date (ascending - oldest first) and startTime (ascending - earliest first)
      const uptimes = Array.from(uptimeMap.values()).sort((a, b) => {
        const dateCompare = new Date(a.date).getTime() - new Date(b.date).getTime();
        if (dateCompare !== 0) return dateCompare;
        return new Date(a.startTime).getTime() - new Date(b.startTime).getTime();
      });

      setIncompleteUptimes(uptimes);
    } catch (error) {
      console.error("Error fetching incomplete uptimes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (uptime: IncompleteUptime) => {
    setSelectedUptime(uptime);
    setEditDialogOpen(true);
  };

  const handleDeleteClick = (uptime: IncompleteUptime) => {
    setUptimeToDelete(uptime);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!uptimeToDelete) return;

    try {
      const response = await fetch(`/uptime/api/uptime?id=${uptimeToDelete.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        throw new Error('Failed to delete uptime');
      }

      toast.success("Uptime deleted successfully!");
      setDeleteDialogOpen(false);
      setUptimeToDelete(null);
      
      // Refresh the list
      fetchIncompleteUptimes();
    } catch (error) {
      console.error('Error deleting uptime:', error);
      toast.error("Failed to delete uptime. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Incomplete Uptimes</h2>
        <div className="text-center py-8 text-gray-500">Loading incomplete uptimes...</div>
      </div>
    );
  }

  if (incompleteUptimes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Incomplete Uptimes</h2>
        <div className="text-center py-8 text-gray-500">No incomplete uptimes found</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Incomplete Uptimes</h2>
      
      <div className="overflow-x-auto overflow-y-visible">
        <table className="border-collapse border border-gray-300 min-w-full">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                Date
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                Start - End
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                Test Run
              </th>
              <th className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap">
                Action
              </th>
              {POWER_SUPPLIES.map((power) => (
                <th 
                  key={power}
                  className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap"
                >
                  {power}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {incompleteUptimes.map((uptime) => (
              <tr key={uptime.id} className="hover:bg-orange-50">
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                  {formatDate(uptime.date)}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                  {formatTime(uptime.startTime)} - 
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                  {uptime.testRun ? 'Yes' : 'No'}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center">
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" className="h-8 w-8 p-0">
                        <span className="sr-only">Open menu</span>
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleComplete(uptime)}>
                        <CheckCircle className="mr-2 h-4 w-4" />
                        Complete
                      </DropdownMenuItem>
                      <DropdownMenuItem 
                        onClick={() => handleDeleteClick(uptime)}
                        className="text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </td>
                {POWER_SUPPLIES.map((power) => (
                  <td 
                    key={power}
                    className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center"
                  >
                    {uptime.powers.includes(displayNameToPowerKey(power)) && (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    )}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <AddUptimeDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        uptimeId={selectedUptime?.id || null}
        existingData={selectedUptime ? {
          date: selectedUptime.date,
          startTime: selectedUptime.startTime,
          testRun: selectedUptime.testRun,
          powers: selectedUptime.powers
        } : null}
        onSuccess={onRefresh}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <button
            onClick={() => setDeleteDialogOpen(false)}
            className="absolute right-4 top-4 rounded-sm opacity-70 ring-offset-background transition-opacity hover:opacity-100 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none data-[state=open]:bg-accent data-[state=open]:text-muted-foreground"
          >
            <X className="h-4 w-4" />
            <span className="sr-only">Close</span>
          </button>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Incomplete</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this uptime record? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConfirm}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
