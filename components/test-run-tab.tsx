"use client";

import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

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

const YEARS = Array.from({ length: 31 }, (_, i) => 2020 + i); // 2020 to 2050

// Function to get the number of days in a month for a given year
function getDaysInMonth(month: number, year: number): number {
  return new Date(year, month + 1, 0).getDate();
}

export function TestRunTab() {
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth());
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());

  const daysInMonth = getDaysInMonth(selectedMonth, selectedYear);

  const handlePreviousMonth = () => {
    if (selectedMonth === 0) {
      setSelectedMonth(11);
      setSelectedYear(selectedYear - 1);
    } else {
      setSelectedMonth(selectedMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (selectedMonth === 11) {
      setSelectedMonth(0);
      setSelectedYear(selectedYear + 1);
    } else {
      setSelectedMonth(selectedMonth + 1);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* Month and Year Controls */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={handlePreviousMonth}
            aria-label="Previous month"
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>

          <div className="text-lg font-semibold text-gray-900">
            {MONTHS[selectedMonth]} {selectedYear}
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleNextMonth}
            aria-label="Next month"
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="month-select-test" className="text-xs font-medium text-gray-700">
              Month
            </label>
            <Select
              value={selectedMonth.toString()}
              onValueChange={(value) => setSelectedMonth(parseInt(value))}
            >
              <SelectTrigger id="month-select-test" className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((month, index) => (
                  <SelectItem key={month} value={index.toString()}>
                    {month}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="year-select-test" className="text-xs font-medium text-gray-700">
              Year
            </label>
            <Select
              value={selectedYear.toString()}
              onValueChange={(value) => setSelectedYear(parseInt(value))}
            >
              <SelectTrigger id="year-select-test" className="w-[120px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
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

      {/* Test Run Table */}
      <div className="overflow-x-auto">
        <table className="w-full border-collapse border border-gray-300">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                Day
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                Run Times
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                G1<sub>test</sub>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                G2<sub>test</sub>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                G3<sub>test</sub>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                G4<sub>test</sub>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                G5<sub>test</sub>
              </th>
              <th className="border border-gray-300 px-4 py-2 text-left text-sm font-semibold text-gray-900">
                G6<sub>test</sub>
              </th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => (
              <tr key={day} className="hover:bg-gray-50">
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  {day}
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  -
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  -
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  -
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  -
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  -
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  -
                </td>
                <td className="border border-gray-300 px-4 py-2 text-sm text-gray-900">
                  -
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
