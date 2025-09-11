import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const endpoint = "https://pasardana.id/api/StockSearchResult/GetAll?pageBegin=0&pageLength=1000&sortField=Code&sortOrder=ASC";
    
    // Fetch data from the external API
    const response = await fetch(endpoint, {
      headers: {
        'Accept': 'application/json, text/plain, */*',
        'Referer': 'https://pasardana.id/'
      },
      // Next.js will handle caching based on the revalidate option
      next: { revalidate: 3600 } // Revalidate every hour
    });

    if (!response.ok) {
      throw new Error(`Failed to fetch stock data: ${response.status} - ${response.statusText}`);
    }
    
    const data = await response.json();
    
    return NextResponse.json({
      message: "Successfully fetched stock data",
      data: data,
    });
  } catch (error) {
    console.error('Error in stock-data API:', error);
    const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
    return NextResponse.json(
      { error: errorMessage },
      { status: 500 }
    );
  }
}
