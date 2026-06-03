import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const SPARQL_ENDPOINT = "https://lod.lobbywatch.ch/query";

async function sparqlQuery(query: string): Promise<{ results: { bindings: Record<string, { value: string; type: string }>[] } }> {
  const resp = await fetch(SPARQL_ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/sparql-query",
      "Accept": "application/sparql-results+json",
    },
    body: query,
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`SPARQL query failed: ${resp.status} — ${text.substring(0, 300)}`);
  }
  return resp.json();
}

function val(binding: Record<string, { value: string }>, key: string): string | null {
  return binding[key]?.value ?? null;
}

const MANDATES_QUERY = `
PREFIX schema: <https://schema.org/>
PREFIX lw: <https://lod.lobbywatch.ch/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX dbo: <https://dbpedia.org/ontology/>

SELECT DISTINCT
  ?mandate
  ?parlamentarier
  ?parlamentarierName
  ?organisation
  ?organisationName
  ?role
  ?sector
  ?isPaid
  ?compensation
  ?startDate
  ?endDate
  ?personNumber
WHERE {
  ?mandate a lw:Interessenbindung ;
           lw:parlamentarier ?parlamentarier ;
           lw:organisation ?organisation .

  ?parlamentarier rdfs:label ?parlamentarierName .
  ?organisation rdfs:label ?organisationName .

  OPTIONAL { ?mandate lw:funktion ?role }
  OPTIONAL { ?organisation lw:branche ?brancheUri .
             ?brancheUri rdfs:label ?sector }
  OPTIONAL { ?mandate lw:vergütung ?compensation }
  OPTIONAL { ?mandate lw:istBezahlt ?isPaid }
  OPTIONAL { ?mandate lw:von ?startDate }
  OPTIONAL { ?mandate lw:bis ?endDate }
  OPTIONAL { ?parlamentarier lw:personNumber ?personNumber }

  FILTER(LANG(?parlamentarierName) = "de" || LANG(?parlamentarierName) = "")
  FILTER(LANG(?organisationName) = "de" || LANG(?organisationName) = "")
}
LIMIT 5000
`;

const ACCESS_RIGHTS_QUERY = `
PREFIX schema: <https://schema.org/>
PREFIX lw: <https://lod.lobbywatch.ch/>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>

SELECT DISTINCT
  ?accessRight
  ?lobbyist
  ?lobbyistName
  ?sponsor
  ?sponsorName
  ?organisation
  ?organisationName
  ?validFrom
  ?validTo
WHERE {
  ?accessRight a lw:Zutrittsberechtigung ;
               lw:lobbyist ?lobbyist ;
               lw:parlamentarier ?sponsor .

  ?lobbyist rdfs:label ?lobbyistName .
  ?sponsor rdfs:label ?sponsorName .

  OPTIONAL { ?accessRight lw:organisation ?organisation .
             ?organisation rdfs:label ?organisationName }
  OPTIONAL { ?accessRight lw:von ?validFrom }
  OPTIONAL { ?accessRight lw:bis ?validTo }

  FILTER(LANG(?sponsorName) = "de" || LANG(?sponsorName) = "")
  FILTER(LANG(?lobbyistName) = "de" || LANG(?lobbyistName) = "")
}
LIMIT 3000
`;

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  const mode = url.searchParams.get("mode") || "mandates"; // mandates | access | all

  const { data: logEntry } = await supabase
    .from("data_sync_log")
    .insert({
      source_name: `lobbywatch.ch/${mode}`,
      sync_type: "full",
      status: "running",
    })
    .select("id")
    .single();

  const logId = logEntry?.id;

  try {
    let mandatesInserted = 0;
    let accessInserted = 0;
    let totalFetched = 0;

    if (mode === "mandates" || mode === "all") {
      const result = await sparqlQuery(MANDATES_QUERY);
      const bindings = result.results.bindings;
      totalFetched += bindings.length;

      for (const b of bindings) {
        const sourceUri = val(b, "mandate");
        if (!sourceUri) continue;

        const row = {
          source_uri: sourceUri,
          parlamentarier_uri: val(b, "parlamentarier"),
          parlamentarier_name: val(b, "parlamentarierName"),
          organisation_uri: val(b, "organisation"),
          organisation_name: val(b, "organisationName"),
          role: val(b, "role"),
          sector: val(b, "sector"),
          compensation_chf: val(b, "compensation") ? parseFloat(val(b, "compensation")!) : null,
          is_paid: val(b, "isPaid") === "true",
          start_date: val(b, "startDate"),
          end_date: val(b, "endDate"),
          is_current: !val(b, "endDate"),
          parliament_member_id: val(b, "personNumber") ? parseInt(val(b, "personNumber")!) : null,
          raw_json: b,
          fetched_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("lobbywatch_mandates_raw")
          .upsert(row, { onConflict: "source_uri" });

        if (!error) mandatesInserted++;
      }

      await supabase.from("data_sync_log")
        .update({ records_fetched: totalFetched })
        .eq("id", logId);
    }

    if (mode === "access" || mode === "all") {
      const result = await sparqlQuery(ACCESS_RIGHTS_QUERY);
      const bindings = result.results.bindings;
      totalFetched += bindings.length;

      for (const b of bindings) {
        const sourceUri = val(b, "accessRight");
        if (!sourceUri) continue;

        const row = {
          source_uri: sourceUri,
          lobbyist_uri: val(b, "lobbyist"),
          lobbyist_name: val(b, "lobbyistName"),
          sponsor_uri: val(b, "sponsor"),
          sponsor_name: val(b, "sponsorName"),
          organisation_uri: val(b, "organisation"),
          organisation_name: val(b, "organisationName"),
          valid_from: val(b, "validFrom"),
          valid_to: val(b, "validTo"),
          is_current: !val(b, "validTo"),
          raw_json: b,
          fetched_at: new Date().toISOString(),
        };

        const { error } = await supabase
          .from("lobbywatch_access_rights_raw")
          .upsert(row, { onConflict: "source_uri" });

        if (!error) accessInserted++;
      }
    }

    await supabase.from("data_sync_log").update({
      status: "success",
      records_fetched: totalFetched,
      records_inserted: mandatesInserted + accessInserted,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        mandates_inserted: mandatesInserted,
        access_rights_inserted: accessInserted,
        total_fetched: totalFetched,
        sync_log_id: logId,
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    await supabase.from("data_sync_log").update({
      status: "error",
      error_message: msg,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);

    return new Response(
      JSON.stringify({ success: false, error: msg }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
