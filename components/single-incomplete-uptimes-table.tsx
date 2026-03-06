"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

interface IncompleteUptime {
  id: number;
  date: string;
  startTime: string;
  testRun: boolean;
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

interface SingleIncompleteUptimesTableProps {
  powerSupply: string;
}

export function SingleIncompleteUptimesTable({ powerSupply }: SingleIncompleteUptimesTableProps) {
  const [incompleteUptimes, setIncompleteUptimes] = useState<IncompleteUptime[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncompleteUptimes();
  }, [powerSupply]);

  const fetchIncompleteUptimes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/uptime/api/uptime/list?status=INCOMPLETE');
      
      if (!response.ok) {
        console.error("Failed to fetch incomplete uptimes");
        return;
      }

      const data = await response.json();
      
      // Filter uptimes for this specific power supply
      const uptimes = data.uptimes?.filter((uptime: any) => {
        // Check if this uptime is for the current power supply
        const powerSupplyMap: { [key: string]: string } = {
          'Ejigbo': 'ejigboId',
          'Isolo': 'isoloId',
          'Generator 1': 'gen1Id',
          'Generator 2': 'gen2Id',
          'Generator 3': 'gen3Id',
          'Generator 4': 'gen4Id',
          'Generator 5': 'gen5Id',
          'Generator 6': 'gen6Id',
          'Generator 7': 'gen7Id',
          'Generator 8': 'gen8Id',
          'Generator 9': 'gen9Id',
          'Generator 10': 'gen10Id',
          'Generator 11': 'gen11Id',
          'Generator 12': 'gen12Id',
        };

        const fieldName = powerSupplyMap[powerSupply];
        return fieldName && uptime[fieldName];
      }).map((uptime: any) => ({
        id: uptime.id,
        date: uptime.date,
        startTime: uptime.startTime,
        testRun: uptime.testRun,
      })) || [];

      setIncompleteUptimes(uptimes);
    } catch (error) {
      console.error("Error fetching incomplete uptimes:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = (uptimeId: number) => {
    // TODO: Open the edit dialog with the uptime data pre-filled
    // This will be implemented when we create the edit/complete dialog
    console.log("Complete uptime:", uptimeId);
  };

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Incomplete Uptimes - {powerSupply}</h2>
        <div className="text-center py-8 text-gray-500">Loading incomplete uptimes...</div>
      </div>
    );
  }

  if (incompleteUptimes.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Incomplete Uptimes - {powerSupply}</h2>
        <div className="text-center py-8 text-gray-500">No incomplete uptimes found for {powerSupply}</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Incomplete Uptimes - {powerSupply}</h2>
      
      <div className="overflow-x-auto">
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
                  <Button
                    size="sm"
                    onClick={() => handleComplete(uptime.id)}
                    className="bg-red-600 hover:bg-red-700 text-white"
                  >
                    Complete
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
