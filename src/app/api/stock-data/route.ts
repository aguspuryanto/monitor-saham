import { NextResponse } from 'next/server';
import fs from "fs";
import path from "path";

export async function GET() {
  try {
    // Coba baca dari file cache dulu
    const filePath = path.join(process.cwd(), 'data', 'summary.json');
    
    // Jika file cache ada dan belum kadaluarsa (misalnya < 1 jam), gunakan yang cache
    if (fs.existsSync(filePath)) {
      const stats = fs.statSync(filePath);
      const mtime = new Date(stats.mtime);
      const now = new Date();
      const diffInHours = (now.getTime() - mtime.getTime()) / (1000 * 60 * 60);
      console.log("diffInHours", diffInHours);
      
      if (diffInHours < 1) {
        const cachedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return NextResponse.json({
          message: "Data dari cache (kurang dari 1 jam)",
          data: cachedData,
        });
      }
    }
    
    // Jika tidak ada cache atau sudah kadaluarsa, ambil data baru
    // const endpoint = "https://www.idx.co.id/primary/TradingSummary/GetStockSummary?length=9999&start=0&_=" + Date.now();
    const endpoint = "https://pasardana.id/api/StockSearchResult/GetAll?pageBegin=0&pageLength=1000&sortField=Code&sortOrder=ASC";
    
    // Gunakan fetch dengan referer yang valid
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://pasardana.id/'
      },
      // Next.js fetch options
      next: { revalidate: 3600 } // Cache response for 1 hour
    });

    if (!response.ok) {
      // Jika gagal, coba baca dari file cache jika ada
      if (fs.existsSync(filePath)) {
        const cachedData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
        return NextResponse.json({
          message: "Gagal fetch data terbaru, menggunakan data cache",
          data: cachedData,
        });
      }
      throw new Error(`Gagal fetch API IDX: ${response.status} - ${response.statusText}`);
    }

    const data = await response.json();
    
    // Simpan ke file cache
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2));

    return NextResponse.json({
      message: "Data berhasil diambil dan disimpan ke cache",
      data,
    });
  } catch (error: unknown) {
    console.error('Error in stock-data API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
