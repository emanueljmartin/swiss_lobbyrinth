import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const API_BASE = "http://ws-old.parlament.ch";

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    // Fetch councillors from Swiss Parliament API
    const response = await fetch(
      `${API_BASE}/councillors/basicdetails?lang=de`,
      {
        headers: {
          "User-Agent": "Mozilla/5.0",
          "Accept": "text/html",
        },
      }
    );

    const html = await response.text();
    const councillors: any[] = [];

    // Simple regex extraction
    const lines = html.split('\n');

    // Find table rows
    let inRow = false;
    let currentCells: string[] = [];
    let cellBuffer = '';
    let rowCount = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      if (line.includes('<tr>')) {
        inRow = true;
        currentCells = [];
        rowCount++;
        continue;
      }

      if (line.includes('</tr>')) {
        inRow = false;
        if (currentCells.length >= 12 && rowCount > 1) {
          councillors.push({
            id: parseInt(currentCells[1]) || 0,
            council: currentCells[3],
            firstName: currentCells[4],
            lastName: currentCells[5],
            canton: currentCells[6],
            party: currentCells[8],
            function: currentCells[12] || 'Mitglied',
          });
        }
        continue;
      }

      if (inRow && line.includes('<td>')) {
        cellBuffer = '';
        const start = line.indexOf('<td>');
        const rest = line.substring(start + 4);
        cellBuffer += rest;
      }

      if (inRow && line.includes('</td>')) {
        const cleaned = cellBuffer
          .replace(/<[^>]*>/g, ' ')
          .replace(/\s+/g, ' ')
          .trim();
        currentCells.push(cleaned);
        cellBuffer = '';
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        count: councillors.length,
        data: councillors.slice(0, 10), // First 10 for testing
        debug: {
          htmlLength: html.length,
          rowCount: rowCount,
          firstRows: html.substring(0, 500),
        },
        timestamp: new Date().toISOString(),
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  }
});
