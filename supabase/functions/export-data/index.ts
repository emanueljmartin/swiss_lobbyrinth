import "jsr:@supabase/functions-js/edge-runtime.d.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const url = new URL(req.url);
  const format = url.searchParams.get("format") || "json";
  const table = url.searchParams.get("table") || "politicians";
  const limit = Math.min(parseInt(url.searchParams.get("limit") || "10000"), 50000);

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  try {
    // Valid export tables
    const allowedTables = [
      "politicians",
      "organizations",
      "mandates",
      "interests",
      "career_milestones",
      "lobbying_meetings",
      "campaign_contributions",
      "vote_records",
      "parliamentary_votes",
      "politician_influence",
      "conflict_flags",
      "politician_risk_scores",
      "campaign_finance_summary",
    ];

    if (!allowedTables.includes(table)) {
      return new Response(
        JSON.stringify({
          error: "Invalid table",
          allowed_tables: allowedTables,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Fetch data
    const response = await fetch(
      `${SUPABASE_URL}/rest/v1/${table}?select=*&limit=${limit}`,
      {
        headers: {
          "apikey": SUPABASE_SERVICE_KEY,
          "Authorization": `Bearer ${SUPABASE_SERVICE_KEY}`,
          "Content-Type": "application/json",
        },
      }
    );

    const data = await response.json();

    if (format === "csv") {
      // Convert to CSV
      if (!Array.isArray(data) || data.length === 0) {
        return new Response("No data", {
          status: 200,
          headers: {
            ...corsHeaders,
            "Content-Type": "text/csv",
            "Content-Disposition": `attachment; filename="${table}.csv"`,
          },
        });
      }

      const headers = Object.keys(data[0]);
      const csvRows = [headers.join(",")];

      for (const row of data) {
        const values = headers.map((h) => {
          const val = row[h];
          if (val === null || val === undefined) return "";
          if (typeof val === "string") return `"${val.replace(/"/g, '""')}"`;
          if (typeof val === "object") return `"${JSON.stringify(val).replace(/"/g, '""')}"`;
          return String(val);
        });
        csvRows.push(values.join(","));
      }

      const csv = csvRows.join("\n");

      return new Response(csv, {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${table}.csv"`,
        },
      });
    } else {
      // JSON format
      return new Response(JSON.stringify(data, null, 2), {
        status: 200,
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
          "Content-Disposition": `attachment; filename="${table}.json"`,
        },
      });
    }
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(
      JSON.stringify({ error: errorMessage }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
