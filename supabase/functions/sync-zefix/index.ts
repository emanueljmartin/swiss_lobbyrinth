import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ZEFIX_BASE = "https://www.zefix.admin.ch/ZefixPublicREST/api/v1";

interface ZefixCompany {
  uid: string;
  name: string;
  legalForm?: { shortName?: string; name?: { de?: string } };
  status?: string;
  canton?: string;
  municipality?: string;
  purpose?: string;
  capital?: { capitalAmount?: number };
  registrationDate?: string;
  cancelDate?: string;
  shabDate?: string;
}

async function searchZefix(name: string): Promise<ZefixCompany[]> {
  const resp = await fetch(`${ZEFIX_BASE}/company/search`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "Accept": "application/json" },
    body: JSON.stringify({ name, maxEntries: 10, activeOnly: false }),
  });
  if (!resp.ok) throw new Error(`Zefix search failed: ${resp.status} for "${name}"`);
  const data = await resp.json();
  return Array.isArray(data) ? data : data.list ?? [];
}

async function fetchZefixByUid(uid: string): Promise<ZefixCompany | null> {
  const encoded = uid.replace(/\./g, "-");
  const resp = await fetch(`${ZEFIX_BASE}/company/uid/${encoded}`, {
    headers: { "Accept": "application/json" },
  });
  if (resp.status === 404) return null;
  if (!resp.ok) throw new Error(`Zefix UID lookup failed: ${resp.status}`);
  return resp.json();
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  const supabase = createClient(
    Deno.env.get("SUPABASE_URL")!,
    Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
  );

  const url = new URL(req.url);
  // mode=search: look up organizations by name; mode=uid: look up by UID list
  const mode = url.searchParams.get("mode") || "search";
  const uid = url.searchParams.get("uid"); // single UID lookup

  const { data: logEntry } = await supabase
    .from("data_sync_log")
    .insert({
      source_name: "zefix.admin.ch",
      sync_type: mode,
      status: "running",
    })
    .select("id")
    .single();

  const logId = logEntry?.id;

  try {
    let fetched = 0;
    let inserted = 0;

    if (mode === "uid" && uid) {
      // Single UID lookup
      const company = await fetchZefixByUid(uid);
      if (company) {
        fetched = 1;
        const row = {
          uid: company.uid,
          name: company.name,
          legal_form: company.legalForm?.shortName ?? company.legalForm?.name?.de ?? null,
          status: company.status ?? null,
          canton: company.canton ?? null,
          municipality: company.municipality ?? null,
          purpose: company.purpose ?? null,
          capital_chf: company.capital?.capitalAmount ?? null,
          registered_at: company.registrationDate ?? null,
          cancelled_at: company.cancelDate ?? null,
          shab_date: company.shabDate ?? null,
          raw_json: company,
          fetched_at: new Date().toISOString(),
        };
        const { error } = await supabase
          .from("zefix_companies_raw")
          .upsert(row, { onConflict: "uid" });
        if (!error) inserted++;
      }
    } else {
      // Bulk mode: fetch all organization names from our organizations table
      // and look them up in Zefix to enrich with legal data
      const { data: orgs } = await supabase
        .from("organizations")
        .select("id, name")
        .limit(200);

      const names = orgs ?? [];
      fetched = names.length;

      for (const org of names) {
        try {
          const results = await searchZefix(org.name);
          if (results.length === 0) continue;

          // Take best match (first result)
          const company = results[0];
          const row = {
            uid: company.uid,
            name: company.name,
            legal_form: company.legalForm?.shortName ?? company.legalForm?.name?.de ?? null,
            status: company.status ?? null,
            canton: company.canton ?? null,
            municipality: company.municipality ?? null,
            purpose: company.purpose ?? null,
            capital_chf: company.capital?.capitalAmount ?? null,
            registered_at: company.registrationDate ?? null,
            cancelled_at: company.cancelDate ?? null,
            shab_date: company.shabDate ?? null,
            raw_json: company,
            fetched_at: new Date().toISOString(),
          };

          const { error } = await supabase
            .from("zefix_companies_raw")
            .upsert(row, { onConflict: "uid" });

          if (!error) {
            inserted++;
            // Back-fill UID into organizations table
            await supabase
              .from("organizations")
              .update({ zefix_uid: company.uid } as Record<string, string>)
              .eq("id", org.id);
          }

          // Polite rate limit
          await new Promise((r) => setTimeout(r, 100));
        } catch {
          // Skip individual failures
          continue;
        }
      }
    }

    await supabase.from("data_sync_log").update({
      status: "success",
      records_fetched: fetched,
      records_inserted: inserted,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        fetched,
        inserted,
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
