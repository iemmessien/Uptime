import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

// Helper type definitions
interface UptimeInput {
  power: string
  startTime: Date
  endTime: Date | null
  testRun: boolean
}

interface TimeSegment {
  startTime: Date
  endTime: Date
  powers: string[]
  testRun: boolean
}

interface ParsedRow {
  date: Date
  powerSupplies: {
    name: string
    startTime: string
    endTime: string
  }[]
}

// Helper function to segment overlapping uptimes
function segmentOverlappingUptimes(uptimes: UptimeInput[]): TimeSegment[] {
  if (uptimes.length === 0) return []
  
  // Filter out incomplete uptimes (without end time)
  const completeUptimes = uptimes.filter(u => u.endTime !== null)
  if (completeUptimes.length === 0) return []
  
  // Collect all unique breakpoints (start and end times)
  const breakpoints = new Set<number>()
  completeUptimes.forEach(uptime => {
    breakpoints.add(uptime.startTime.getTime())
    if (uptime.endTime) {
      breakpoints.add(uptime.endTime.getTime())
    }
  })
  
  // Sort breakpoints chronologically
  const sortedBreakpoints = Array.from(breakpoints).sort((a, b) => a - b)
  
  // Create segments between consecutive breakpoints
  const segments: TimeSegment[] = []
  for (let i = 0; i < sortedBreakpoints.length - 1; i++) {
    const segmentStart = new Date(sortedBreakpoints[i])
    const segmentEnd = new Date(sortedBreakpoints[i + 1])
    
    // Determine which power supplies are ON during this segment
    const activePowersSet = new Set<string>()
    let isTestRun = false
    
    completeUptimes.forEach(uptime => {
      if (uptime.endTime && 
          uptime.startTime.getTime() <= segmentStart.getTime() && 
          uptime.endTime.getTime() >= segmentEnd.getTime()) {
        activePowersSet.add(uptime.power)
        if (uptime.testRun) {
          isTestRun = true
        }
      }
    })
    
    const activePowers = Array.from(activePowersSet)
    
    if (activePowers.length > 0) {
      segments.push({
        startTime: segmentStart,
        endTime: segmentEnd,
        powers: activePowers,
        testRun: isTestRun
      })
    }
  }
  
  return segments
}

function parseDate(dateStr: string): Date {
  // Parse DD/MM/YYYY format
  const parts = dateStr.trim().split('/');
  if (parts.length !== 3) throw new Error(`Invalid date format: ${dateStr}`);
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  // Parse HH:MM format
  if (!timeStr || timeStr.trim() === '') {
    return { hours: 0, minutes: 0 };
  }
  const parts = timeStr.trim().split(':');
  if (parts.length !== 2) throw new Error(`Invalid time format: ${timeStr}`);
  return {
    hours: parseInt(parts[0]) || 0,
    minutes: parseInt(parts[1]) || 0,
  };
}

function parseCSV(csvContent: string): ParsedRow[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const rows: ParsedRow[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header line
    if (line.toLowerCase().includes('date') && line.toLowerCase().includes('ejigbo')) {
      continue;
    }

    const columns = line.split(',').map(col => col.trim());
    
    // Expected format: Date, Ejigbo, Start Time, End Time, Isolo, Start Time, End Time, Gen 1, Start Time, End Time, ...
    // Total: 1 (date) + 7 power supplies * 3 columns each = 22 columns
    // But actually: 1 (date) + 8 power supplies * 3 = 25 columns total
    // Columns: 0=Date, 1=Ejigbo name, 2=E start, 3=E end, 4=Isolo name, 5=I start, 6=I end,
    //          7=G1 name, 8=G1 start, 9=G1 end, 10=G2 name, 11=G2 start, 12=G2 end,
    //          13=G3 name, 14=G3 start, 15=G3 end, 16=G4 name, 17=G4 start, 18=G4 end,
    //          19=G5 name, 20=G5 start, 21=G5 end, 22=G6 name, 23=G6 start, 24=G6 end
    if (columns.length < 25) {
      console.warn(`Skipping row ${i + 1}: insufficient columns (${columns.length}/25)`);
      continue;
    }

    try {
      const date = parseDate(columns[0]);
      
      // Parse power supplies (skip the name column, only extract start/end times)
      const powerSupplies = [
        { name: 'Ejigbo', startTime: columns[2], endTime: columns[3] },
        { name: 'Isolo', startTime: columns[5], endTime: columns[6] },
        { name: 'Gen 1', startTime: columns[8], endTime: columns[9] },
        { name: 'Gen 2', startTime: columns[11], endTime: columns[12] },
        { name: 'Gen 3', startTime: columns[14], endTime: columns[15] },
        { name: 'Gen 4', startTime: columns[17], endTime: columns[18] },
        { name: 'Gen 5', startTime: columns[20], endTime: columns[21] },
        { name: 'Gen 6', startTime: columns[23], endTime: columns[24] },
      ].filter(ps => ps.startTime && ps.startTime.trim() !== ''); // Only include power supplies with start time

      rows.push({ date, powerSupplies });
    } catch (error) {
      console.warn(`Skipping row ${i + 1}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }

  return rows;
}


async function ensurePowerSupplies() {
  // Ensure Ejigbo exists
  let ejigbo = await prisma.ejigbo.findFirst();
  if (!ejigbo) {
    ejigbo = await prisma.ejigbo.create({
      data: { name: 'Ejigbo Grid' },
    });
  }

  // Ensure Isolo exists
  let isolo = await prisma.isolo.findFirst();
  if (!isolo) {
    isolo = await prisma.isolo.create({
      data: { name: 'Isolo Grid' },
    });
  }

  // Ensure generators 1-6 exist
  const generators: any = {};
  for (let i = 1; i <= 6; i++) {
    const genModel = `gen${i}` as any;
    const genName = `Generator ${i}`;
    
    let gen = await (prisma as any)[genModel].findFirst();
    if (!gen) {
      gen = await (prisma as any)[genModel].create({
        data: { name: genName },
      });
    }
    generators[`gen${i}`] = gen;
  }

  return { ejigbo, isolo, ...generators };
}

async function createUptimeRecords(rows: ParsedRow[]) {
  const powerSupplies = await ensurePowerSupplies();
  const createdCount = { total: 0, byPowerSupply: {} as Record<string, number> };

  // Process each row (date)
  for (const row of rows) {
    const date = row.date;
    
    // Generate dayNumber (e.g., "2026022601")
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dayNumber = `${year}${month}${day}01`;

    // Convert power supplies to UptimeInput format for segmentation
    const uptimeInputs: UptimeInput[] = [];
    
    for (const ps of row.powerSupplies) {
      if (!ps.startTime || !ps.endTime) continue;
      
      try {
        const startTimeParsed = parseTime(ps.startTime);
        const endTimeParsed = parseTime(ps.endTime);

        const startTime = new Date(date);
        startTime.setHours(startTimeParsed.hours, startTimeParsed.minutes, 0, 0);

        const endTime = new Date(date);
        endTime.setHours(endTimeParsed.hours, endTimeParsed.minutes, 0, 0);
        
        // Handle end time on next day
        if (endTime <= startTime) {
          endTime.setDate(endTime.getDate() + 1);
        }

        uptimeInputs.push({
          power: ps.name,
          startTime,
          endTime,
          testRun: false, // Will determine this based on which power supplies are active
        });
      } catch (error) {
        console.warn(`Skipping power supply ${ps.name} for date ${date}: ${error instanceof Error ? error.message : String(error)}`);
      }
    }

    if (uptimeInputs.length === 0) {
      console.warn(`No valid uptimes for date ${date.toISOString()}`);
      continue;
    }

    // Segment overlapping uptimes
    const segments = segmentOverlappingUptimes(uptimeInputs);
    
    console.log(`Date ${date.toISOString().split('T')[0]}: Created ${segments.length} segments from ${uptimeInputs.length} uptimes`);

    // Create uptime records for each segment
    for (const segment of segments) {
      const segmentDuration = Math.round((segment.endTime.getTime() - segment.startTime.getTime()) / (1000 * 60)); // in minutes
      
      // Determine if this is a test run (generators only, no grid)
      const hasEjigbo = segment.powers.includes('Ejigbo');
      const hasIsolo = segment.powers.includes('Isolo');
      const hasGenerators = segment.powers.some(p => p.startsWith('Gen '));
      const isTestRun = hasGenerators && !hasEjigbo && !hasIsolo;

      // Helper function to calculate utilization
      const calculateUtilization = (power: string): number => {
        // Rule 1: If Test Run, utilization is always 0
        if (isTestRun) {
          return 0;
        }

        // Rule 2: If Ejigbo is ON
        if (hasEjigbo) {
          // Ejigbo gets 100% of its runtime as utilization
          if (power === 'Ejigbo') {
            return segmentDuration;
          }
          // All other power supplies get 0 utilization
          return 0;
        }

        // Rule 3: If Ejigbo is OFF but Isolo is ON
        if (!hasEjigbo && hasIsolo) {
          // Isolo gets 50% of its runtime as utilization
          if (power === 'Isolo') {
            return segmentDuration * 0.5;
          }
          // Generators get 0 (combined utilization handled elsewhere if needed)
          return 0;
        }

        // Rule 4: If neither Ejigbo nor Isolo is ON
        return 0;
      };

      // Create uptime records for each active power supply in this segment
      for (const power of segment.powers) {
        const utilization = calculateUtilization(power);
        
        let powerSupplyData: any = {};
        
        // Map power name to database field
        if (power === 'Ejigbo') {
          powerSupplyData.ejigboId = powerSupplies.ejigbo.id;
        } else if (power === 'Isolo') {
          powerSupplyData.isoloId = powerSupplies.isolo.id;
        } else if (power.startsWith('Gen ')) {
          const genNum = power.replace('Gen ', '');
          const genKey = `gen${genNum}` as keyof typeof powerSupplies;
          powerSupplyData[`gen${genNum}Id`] = powerSupplies[genKey].id;
        }

        await prisma.uptime.create({
          data: {
            date,
            startTime: segment.startTime,
            endTime: segment.endTime,
            runTime: segmentDuration,
            utilization,
            testRun: isTestRun,
            status: 'COMPLETE',
            dayNumber,
            ...powerSupplyData,
          },
        });

        createdCount.total++;
        if (!createdCount.byPowerSupply[power]) {
          createdCount.byPowerSupply[power] = 0;
        }
        createdCount.byPowerSupply[power]++;
      }
    }
  }

  return createdCount;
}

export async function POST(request: NextRequest) {
  console.log('🔥 POST /api/uptime/import called');

  try {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
      return NextResponse.json(
        { success: false, error: 'No file uploaded' },
        { status: 400 }
      );
    }

    console.log('📁 File received:', file.name, 'Size:', file.size);

    // Read file content
    const csvContent = await file.text();
    console.log('📄 CSV content length:', csvContent.length);

    // Parse CSV
    const rows = parseCSV(csvContent);
    console.log('📊 Parsed rows:', rows.length);

    if (rows.length === 0) {
      return NextResponse.json(
        { success: false, error: 'No valid data found in CSV file' },
        { status: 400 }
      );
    }

    // Create uptime records
    const createdCount = await createUptimeRecords(rows);
    console.log('✅ Created uptimes:', createdCount);

    return NextResponse.json({
      success: true,
      message: `Successfully imported ${createdCount.total} uptime records`,
      details: createdCount,
    });
  } catch (error) {
    console.error('❌ Error importing uptime data:', error);
    return NextResponse.json(
      { 
        success: false, 
        error: 'Failed to import uptime data',
        details: error instanceof Error ? error.message : String(error)
      },
      { status: 500 }
    );
  } finally {
    await prisma.$disconnect();
  }
}
