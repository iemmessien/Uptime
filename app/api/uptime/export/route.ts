import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface UptimeRecord {
  id: string;
  date: string;
  powerSupply: string;
  startTime: string;
  endTime: string | null;
  duration: number;
  utilization: number;
  testRun: boolean;
}

interface TimeInterval {
  startTime: string;
  endTime: string;
  duration: number;
  powerSupplies: UptimeRecord[];
  totals: {
    ejigbo_av: number;
    isolo_av: number;
    g1_av: number;
    g2_av: number;
    g3_av: number;
    g4_av: number;
    g5_av: number;
    g6_av: number;
    g7_av: number;
    g8_av: number;
    g9_av: number;
    g10_av: number;
    g11_av: number;
    g12_av: number;
    ejigbo_uz: number;
    isolo_uz: number;
    generators_uz: number;
    total_uz: number;
  };
}

interface DayData {
  day: number;
  intervals: TimeInterval[];
  totals: {
    ejigbo_av: number;
    isolo_av: number;
    g1_av: number;
    g2_av: number;
    g3_av: number;
    g4_av: number;
    g5_av: number;
    g6_av: number;
    g7_av: number;
    g8_av: number;
    g9_av: number;
    g10_av: number;
    g11_av: number;
    g12_av: number;
    ejigbo_uz: number;
    isolo_uz: number;
    generators_uz: number;
    total_uz: number;
  };
}

function formatDuration(minutes: number): string {
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}`;
}

function formatTime(timeString: string): string {
  const date = new Date(timeString);
  const hours = date.getHours().toString().padStart(2, '0');
  const minutes = date.getMinutes().toString().padStart(2, '0');
  return `${hours}:${minutes}`;
}

function formatDate(day: number, month: number, year: number): string {
  const date = new Date(year, month, day);
  const dayStr = date.getDate().toString().padStart(2, '0');
  const monthStr = (date.getMonth() + 1).toString().padStart(2, '0');
  const yearStr = date.getFullYear();
  return `${dayStr}/${monthStr}/${yearStr}`;
}

function getMonthName(month: number): string {
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December"
  ];
  return months[month];
}

async function processMonthData(month: number, year: number): Promise<Map<number, DayData>> {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0, 23, 59, 59);

  const uptimes = await prisma.uptime.findMany({
    where: {
      date: {
        gte: startDate,
        lte: endDate,
      },
    },
    include: {
      ejigbo: true,
      isolo: true,
      gen1: true,
      gen2: true,
      gen3: true,
      gen4: true,
      gen5: true,
      gen6: true,
      gen7: true,
      gen8: true,
      gen9: true,
      gen10: true,
      gen11: true,
      gen12: true,
    },
    orderBy: {
      date: 'asc',
    },
  });

  // Transform data
  const transformedUptimes: UptimeRecord[] = uptimes.map((uptime) => {
    let powerSupply = 'Unknown';
    
    if (uptime.ejigbo) powerSupply = 'Ejigbo';
    else if (uptime.isolo) powerSupply = 'Isolo';
    else if (uptime.gen1) powerSupply = 'Generator 1';
    else if (uptime.gen2) powerSupply = 'Generator 2';
    else if (uptime.gen3) powerSupply = 'Generator 3';
    else if (uptime.gen4) powerSupply = 'Generator 4';
    else if (uptime.gen5) powerSupply = 'Generator 5';
    else if (uptime.gen6) powerSupply = 'Generator 6';
    else if (uptime.gen7) powerSupply = 'Generator 7';
    else if (uptime.gen8) powerSupply = 'Generator 8';
    else if (uptime.gen9) powerSupply = 'Generator 9';
    else if (uptime.gen10) powerSupply = 'Generator 10';
    else if (uptime.gen11) powerSupply = 'Generator 11';
    else if (uptime.gen12) powerSupply = 'Generator 12';

    return {
      id: uptime.id,
      date: uptime.date.toISOString(),
      powerSupply,
      startTime: uptime.startTime.toISOString(),
      endTime: uptime.endTime ? uptime.endTime.toISOString() : null,
      duration: uptime.runTime || 0,
      utilization: uptime.utilization || 0,
      testRun: uptime.testRun || false,
    };
  });

  // Group uptimes by day and time interval
  const dayMap = new Map<number, DayData>();
  const timeIntervalMap = new Map<string, UptimeRecord[]>();

  transformedUptimes.forEach((uptime) => {
    // Only include COMPLETE uptimes (those with both startTime and endTime)
    if (!uptime.endTime) {
      return;
    }

    const uptimeDate = new Date(uptime.date);
    const day = uptimeDate.getDate();
    
    // Create a unique key for each time interval within a day
    const timeKey = `${day}-${uptime.startTime}-${uptime.endTime}`;
    
    if (!timeIntervalMap.has(timeKey)) {
      timeIntervalMap.set(timeKey, []);
    }
    timeIntervalMap.get(timeKey)!.push(uptime);
  });

  // Process each time interval group
  timeIntervalMap.forEach((intervalUptimes, timeKey) => {
    const day = parseInt(timeKey.split('-')[0]);

    if (!dayMap.has(day)) {
      dayMap.set(day, {
        day,
        intervals: [],
        totals: {
          ejigbo_av: 0,
          isolo_av: 0,
          g1_av: 0,
          g2_av: 0,
          g3_av: 0,
          g4_av: 0,
          g5_av: 0,
          g6_av: 0,
          g7_av: 0,
          g8_av: 0,
          g9_av: 0,
          g10_av: 0,
          g11_av: 0,
          g12_av: 0,
          ejigbo_uz: 0,
          isolo_uz: 0,
          generators_uz: 0,
          total_uz: 0,
        },
      });
    }

    const firstUptime = intervalUptimes[0];
    
    let intervalTotals = {
      ejigbo_av: 0,
      isolo_av: 0,
      g1_av: 0,
      g2_av: 0,
      g3_av: 0,
      g4_av: 0,
      g5_av: 0,
      g6_av: 0,
      g7_av: 0,
      g8_av: 0,
      g9_av: 0,
      g10_av: 0,
      g11_av: 0,
      g12_av: 0,
      ejigbo_uz: 0,
      isolo_uz: 0,
      generators_uz: 0,
      total_uz: 0,
    };

    const hasEjigbo = intervalUptimes.some(u => u.powerSupply === 'Ejigbo');
    const hasIsolo = intervalUptimes.some(u => u.powerSupply === 'Isolo');
    const generators = intervalUptimes.filter(u => u.powerSupply.startsWith('Generator'));
    const generatorCount = generators.length;
    const isTestRun = firstUptime.testRun;
    const runTime = firstUptime.duration;

    intervalUptimes.forEach((uptime) => {
      switch (uptime.powerSupply) {
        case "Ejigbo":
          intervalTotals.ejigbo_av += uptime.duration;
          intervalTotals.ejigbo_uz += uptime.utilization;
          break;
        case "Isolo":
          intervalTotals.isolo_av += uptime.duration;
          intervalTotals.isolo_uz += uptime.utilization;
          break;
        case "Generator 1":
          intervalTotals.g1_av += uptime.duration;
          break;
        case "Generator 2":
          intervalTotals.g2_av += uptime.duration;
          break;
        case "Generator 3":
          intervalTotals.g3_av += uptime.duration;
          break;
        case "Generator 4":
          intervalTotals.g4_av += uptime.duration;
          break;
        case "Generator 5":
          intervalTotals.g5_av += uptime.duration;
          break;
        case "Generator 6":
          intervalTotals.g6_av += uptime.duration;
          break;
        case "Generator 7":
          intervalTotals.g7_av += uptime.duration;
          break;
        case "Generator 8":
          intervalTotals.g8_av += uptime.duration;
          break;
        case "Generator 9":
          intervalTotals.g9_av += uptime.duration;
          break;
        case "Generator 10":
          intervalTotals.g10_av += uptime.duration;
          break;
        case "Generator 11":
          intervalTotals.g11_av += uptime.duration;
          break;
        case "Generator 12":
          intervalTotals.g12_av += uptime.duration;
          break;
      }
    });

    // Calculate generators_uz based on rules
    if (!isTestRun && !hasEjigbo && hasIsolo && generatorCount === 2) {
      intervalTotals.generators_uz = runTime * 0.5;
    }

    // Calculate total_uz
    intervalTotals.total_uz = intervalTotals.ejigbo_uz + intervalTotals.isolo_uz + intervalTotals.generators_uz;

    const timeInterval: TimeInterval = {
      startTime: firstUptime.startTime,
      endTime: firstUptime.endTime!,
      duration: firstUptime.duration,
      powerSupplies: intervalUptimes,
      totals: intervalTotals,
    };

    dayMap.get(day)!.intervals.push(timeInterval);
    
    const dayData = dayMap.get(day)!;
    dayData.totals.ejigbo_av += intervalTotals.ejigbo_av;
    dayData.totals.isolo_av += intervalTotals.isolo_av;
    dayData.totals.g1_av += intervalTotals.g1_av;
    dayData.totals.g2_av += intervalTotals.g2_av;
    dayData.totals.g3_av += intervalTotals.g3_av;
    dayData.totals.g4_av += intervalTotals.g4_av;
    dayData.totals.g5_av += intervalTotals.g5_av;
    dayData.totals.g6_av += intervalTotals.g6_av;
    dayData.totals.g7_av += intervalTotals.g7_av;
    dayData.totals.g8_av += intervalTotals.g8_av;
    dayData.totals.g9_av += intervalTotals.g9_av;
    dayData.totals.g10_av += intervalTotals.g10_av;
    dayData.totals.g11_av += intervalTotals.g11_av;
    dayData.totals.g12_av += intervalTotals.g12_av;
    dayData.totals.ejigbo_uz += intervalTotals.ejigbo_uz;
    dayData.totals.isolo_uz += intervalTotals.isolo_uz;
    dayData.totals.generators_uz += intervalTotals.generators_uz;
    dayData.totals.total_uz += intervalTotals.total_uz;
  });

  return dayMap;
}

function generateCSV(dataByMonth: Array<{ month: number; year: number; dayMap: Map<number, DayData> }>): string {
  const lines: string[] = [];
  const header = 'Date,Start Time,End Time,Ejigbo(av),Isolo(av),G1(av),G2(av),G3(av),G4(av),G5(av),G6(av),Generators(av),Ejigbo(uz),Isolo(uz),Generators(uz),Total(uz)';

  dataByMonth.forEach((monthData, monthIndex) => {
    const { month, year, dayMap } = monthData;
    
    // Add month header
    lines.push(header);

    // Sort days
    const sortedDays = Array.from(dayMap.keys()).sort((a, b) => a - b);

    sortedDays.forEach((day) => {
      const dayData = dayMap.get(day)!;
      
      // Add parent row (day total)
      const dateStr = formatDate(day, month, year);
      const generators_av = dayData.totals.g1_av + dayData.totals.g2_av + dayData.totals.g3_av +
                           dayData.totals.g4_av + dayData.totals.g5_av + dayData.totals.g6_av +
                           dayData.totals.g7_av + dayData.totals.g8_av + dayData.totals.g9_av +
                           dayData.totals.g10_av + dayData.totals.g11_av + dayData.totals.g12_av;
      
      lines.push(
        `${dateStr},,,${formatDuration(dayData.totals.ejigbo_av)},${formatDuration(dayData.totals.isolo_av)},` +
        `${formatDuration(dayData.totals.g1_av)},${formatDuration(dayData.totals.g2_av)},${formatDuration(dayData.totals.g3_av)},` +
        `${formatDuration(dayData.totals.g4_av)},${formatDuration(dayData.totals.g5_av)},${formatDuration(dayData.totals.g6_av)},` +
        `${formatDuration(generators_av)},${formatDuration(dayData.totals.ejigbo_uz)},${formatDuration(dayData.totals.isolo_uz)},` +
        `${formatDuration(dayData.totals.generators_uz)},${formatDuration(dayData.totals.total_uz)}`
      );

      // Add child rows (intervals)
      dayData.intervals.forEach((interval) => {
        const startTime = formatTime(interval.startTime);
        const endTime = formatTime(interval.endTime);
        const generators_av_interval = interval.totals.g1_av + interval.totals.g2_av + interval.totals.g3_av +
                                       interval.totals.g4_av + interval.totals.g5_av + interval.totals.g6_av +
                                       interval.totals.g7_av + interval.totals.g8_av + interval.totals.g9_av +
                                       interval.totals.g10_av + interval.totals.g11_av + interval.totals.g12_av;
        
        lines.push(
          `-,${startTime},${endTime},${formatDuration(interval.totals.ejigbo_av)},${formatDuration(interval.totals.isolo_av)},` +
          `${formatDuration(interval.totals.g1_av)},${formatDuration(interval.totals.g2_av)},${formatDuration(interval.totals.g3_av)},` +
          `${formatDuration(interval.totals.g4_av)},${formatDuration(interval.totals.g5_av)},${formatDuration(interval.totals.g6_av)},` +
          `${formatDuration(generators_av_interval)},${formatDuration(interval.totals.ejigbo_uz)},${formatDuration(interval.totals.isolo_uz)},` +
          `${formatDuration(interval.totals.generators_uz)},${formatDuration(interval.totals.total_uz)}`
        );
      });
    });

    // Add two blank lines between months (except after the last month)
    if (monthIndex < dataByMonth.length - 1) {
      lines.push('');
      lines.push('');
    }
  });

  return lines.join('\n');
}

export async function GET(request: NextRequest) {
  console.log('🔥 GET /api/uptime/export called');
  
  try {
    const searchParams = request.nextUrl.searchParams;
    const startMonth = parseInt(searchParams.get('startMonth') || '0');
    const startYear = parseInt(searchParams.get('startYear') || new Date().getFullYear().toString());
    const endMonth = parseInt(searchParams.get('endMonth') || '0');
    const endYear = parseInt(searchParams.get('endYear') || new Date().getFullYear().toString());

    console.log('🔥 Export params:', { startMonth, startYear, endMonth, endYear });

    // Collect data for all months in the range
    const dataByMonth: Array<{ month: number; year: number; dayMap: Map<number, DayData> }> = [];
    
    let currentYear = startYear;
    let currentMonth = startMonth;

    while (currentYear < endYear || (currentYear === endYear && currentMonth <= endMonth)) {
      const dayMap = await processMonthData(currentMonth, currentYear);
      dataByMonth.push({ month: currentMonth, year: currentYear, dayMap });

      // Move to next month
      currentMonth++;
      if (currentMonth > 11) {
        currentMonth = 0;
        currentYear++;
      }
    }

    // Generate CSV
    const csvContent = generateCSV(dataByMonth);

    // Generate filename with current date (day-month-year format)
    const now = new Date();
    const day = now.getDate().toString().padStart(2, '0');
    const month = (now.getMonth() + 1).toString().padStart(2, '0');
    const year = now.getFullYear();
    const filename = `uptime-export-${day}-${month}-${year}.csv`;

    console.log('✅ Generated CSV file:', filename);

    // Return CSV file
    return new NextResponse(csvContent, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="${filename}"`,
      },
    });
  } catch (error) {
    console.error('❌ Error exporting uptime data:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to export uptime data' },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
