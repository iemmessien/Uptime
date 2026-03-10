import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface CSVRow {
  date: string;
  startTime: string;
  endTime: string;
  ejigbo_av: number;
  isolo_av: number;
  g1_av: number;
  g2_av: number;
  g3_av: number;
  g4_av: number;
  g5_av: number;
  g6_av: number;
  generators_av: number;
  ejigbo_uz: number;
  isolo_uz: number;
  generators_uz: number;
}

function parseDuration(durationStr: string): number {
  // Parse HH:MM format to minutes
  const parts = durationStr.split(':');
  if (parts.length !== 2) return 0;
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;
  return hours * 60 + minutes;
}

function parseDate(dateStr: string): Date {
  // Parse DD/MM/YYYY format
  const parts = dateStr.split('/');
  if (parts.length !== 3) throw new Error(`Invalid date format: ${dateStr}`);
  const day = parseInt(parts[0]);
  const month = parseInt(parts[1]) - 1; // Month is 0-indexed
  const year = parseInt(parts[2]);
  return new Date(year, month, day);
}

function parseTime(timeStr: string): { hours: number; minutes: number } {
  // Parse HH:MM format
  const parts = timeStr.split(':');
  if (parts.length !== 2) throw new Error(`Invalid time format: ${timeStr}`);
  return {
    hours: parseInt(parts[0]) || 0,
    minutes: parseInt(parts[1]) || 0,
  };
}

function parseCSV(csvContent: string): CSVRow[] {
  const lines = csvContent.split('\n').map(line => line.trim()).filter(line => line.length > 0);
  const rows: CSVRow[] = [];
  let currentDate: string | null = null;

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Skip header lines
    if (line.startsWith('Date,Start Time,End Time')) {
      continue;
    }

    const columns = line.split(',');
    if (columns.length < 15) {
      continue; // Skip invalid rows
    }

    const dateCol = columns[0].trim();
    const startTimeCol = columns[1].trim();
    const endTimeCol = columns[2].trim();

    // Check if this is a parent row (has date, no start/end time)
    if (dateCol && dateCol !== '-' && !startTimeCol && !endTimeCol) {
      currentDate = dateCol;
      // Skip parent rows, we only need child rows for creating uptimes
      continue;
    }

    // This is a child row (has start/end time, date is dash)
    if (dateCol === '-' && startTimeCol && endTimeCol && currentDate) {
      rows.push({
        date: currentDate,
        startTime: startTimeCol,
        endTime: endTimeCol,
        ejigbo_av: parseDuration(columns[3].trim()),
        isolo_av: parseDuration(columns[4].trim()),
        g1_av: parseDuration(columns[5].trim()),
        g2_av: parseDuration(columns[6].trim()),
        g3_av: parseDuration(columns[7].trim()),
        g4_av: parseDuration(columns[8].trim()),
        g5_av: parseDuration(columns[9].trim()),
        g6_av: parseDuration(columns[10].trim()),
        generators_av: parseDuration(columns[11].trim()),
        ejigbo_uz: parseDuration(columns[12].trim()),
        isolo_uz: parseDuration(columns[13].trim()),
        generators_uz: parseDuration(columns[14].trim()),
      });
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

  // Ensure all 12 generators exist
  const generators: any = {};
  for (let i = 1; i <= 12; i++) {
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

async function createUptimeRecords(rows: CSVRow[]) {
  const powerSupplies = await ensurePowerSupplies();
  const createdCount = { total: 0, ejigbo: 0, isolo: 0, generators: 0 };

  for (const row of rows) {
    const date = parseDate(row.date);
    const startTimeParsed = parseTime(row.startTime);
    const endTimeParsed = parseTime(row.endTime);

    const startTime = new Date(date);
    startTime.setHours(startTimeParsed.hours, startTimeParsed.minutes, 0, 0);

    const endTime = new Date(date);
    endTime.setHours(endTimeParsed.hours, endTimeParsed.minutes, 0, 0);
    
    // Handle end time on next day
    if (endTime <= startTime) {
      endTime.setDate(endTime.getDate() + 1);
    }

    // Generate dayNumber (e.g., "2026022601")
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    const dayNumber = `${year}${month}${day}01`;

    // Determine if this is a test run
    // A test run is when generators are running but no grid (Ejigbo/Isolo)
    const isTestRun = row.generators_av > 0 && row.ejigbo_av === 0 && row.isolo_av === 0;

    // Count active generators
    const activeGenerators = [
      row.g1_av, row.g2_av, row.g3_av, row.g4_av, row.g5_av, row.g6_av
    ].filter(av => av > 0).length;

    // Create Ejigbo uptime if it has availability
    if (row.ejigbo_av > 0) {
      await prisma.uptime.create({
        data: {
          date,
          startTime,
          endTime,
          runTime: row.ejigbo_av,
          utilization: row.ejigbo_uz,
          testRun: false,
          status: 'COMPLETE',
          dayNumber,
          ejigboId: powerSupplies.ejigbo.id,
        },
      });
      createdCount.ejigbo++;
      createdCount.total++;
    }

    // Create Isolo uptime if it has availability
    if (row.isolo_av > 0) {
      await prisma.uptime.create({
        data: {
          date,
          startTime,
          endTime,
          runTime: row.isolo_av,
          utilization: row.isolo_uz,
          testRun: false,
          status: 'COMPLETE',
          dayNumber,
          isoloId: powerSupplies.isolo.id,
        },
      });
      createdCount.isolo++;
      createdCount.total++;
    }

    // Create generator uptimes
    const generatorData = [
      { av: row.g1_av, id: powerSupplies.gen1.id, field: 'gen1Id' },
      { av: row.g2_av, id: powerSupplies.gen2.id, field: 'gen2Id' },
      { av: row.g3_av, id: powerSupplies.gen3.id, field: 'gen3Id' },
      { av: row.g4_av, id: powerSupplies.gen4.id, field: 'gen4Id' },
      { av: row.g5_av, id: powerSupplies.gen5.id, field: 'gen5Id' },
      { av: row.g6_av, id: powerSupplies.gen6.id, field: 'gen6Id' },
    ];

    for (const gen of generatorData) {
      if (gen.av > 0) {
        // Generator utilization is 0 unless specific conditions are met
        // Based on export logic: generators get utilization only when Isolo + 2 generators
        let genUtilization = 0;
        
        await prisma.uptime.create({
          data: {
            date,
            startTime,
            endTime,
            runTime: gen.av,
            utilization: genUtilization,
            testRun: isTestRun,
            status: 'COMPLETE',
            dayNumber,
            [gen.field]: gen.id,
          },
        });
        createdCount.generators++;
        createdCount.total++;
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
