"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Check } from "lucide-react";

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

export function IncompleteUptimesTable() {
  const [incompleteUptimes, setIncompleteUptimes] = useState<IncompleteUptime[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchIncompleteUptimes();
  }, []);

  const fetchIncompleteUptimes = async () => {
    setLoading(true);
    try {
      const response = await fetch('/uptime/api/uptime/list?status=INCOMPLETE');
      
      if (!response.ok) {
        console.error("Failed to fetch incomplete uptimes");
        return;
      }

      const data = await response.json();
      
      // Transform the data to match our interface
      const uptimes = data.uptimes?.map((uptime: any) => {
        const powers: string[] = [];
        
        // Map the power supply relationships to power names
        if (uptime.ejigboId) powers.push('Ejigbo');
        if (uptime.isoloId) powers.push('Isolo');
        if (uptime.gen1Id) powers.push('G1');
        if (uptime.gen2Id) powers.push('G2');
        if (uptime.gen3Id) powers.push('G3');
        if (uptime.gen4Id) powers.push('G4');
        if (uptime.gen5Id) powers.push('G5');
        if (uptime.gen6Id) powers.push('G6');
        if (uptime.gen7Id) powers.push('G7');
        if (uptime.gen8Id) powers.push('G8');
        if (uptime.gen9Id) powers.push('G9');
        if (uptime.gen10Id) powers.push('G10');
        if (uptime.gen11Id) powers.push('G11');
        if (uptime.gen12Id) powers.push('G12');

        return {
          id: uptime.id,
          date: uptime.date,
          startTime: uptime.startTime,
          testRun: uptime.testRun,
          powers
        };
      }) || [];

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
              {POWER_SUPPLIES.map((power) => (
                <th 
                  key={power}
                  className="border border-gray-300 px-4 py-2 text-center text-sm font-semibold text-gray-900 whitespace-nowrap"
                >
                  {power}
                </th>
              ))}
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
                {POWER_SUPPLIES.map((power) => (
                  <td 
                    key={power}
                    className="border border-gray-300 px-4 py-2 text-sm text-gray-900 whitespace-nowrap text-center"
                  >
                    {uptime.powers.includes(power) && (
                      <Check className="h-5 w-5 text-green-600 mx-auto" />
                    )}
                  </td>
                ))}
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
