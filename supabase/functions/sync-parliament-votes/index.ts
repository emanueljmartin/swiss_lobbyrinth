import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

const ODATA_BASE = "https://ws.parlament.ch/odata.svc";
// Current (51st) legislative period — filter to avoid fetching all historical data
const CURRENT_LEGISLATIVE_PERIOD = 51;
const PAGE_SIZE = 1000;

function parseMsDate(msDate: string | null | undefined): string | null {
  if (!msDate) return null;
  const match = msDate.match(/\/Date\((-?\d+)/);
  if (!match) return null;
  return new Date(parseInt(match[1])).toISOString();
}

interface ODataVote {
  ID: number;
  Language: string;
  RegistrationNumber: number;
  BusinessNumber: number;
  BusinessShortNumber: string;
  BusinessTitle: string;
  BillNumber: number;
  BillTitle: string;
  IdLegislativePeriod: number;
  IdSession: number;
  SessionName: string;
  Subject: string;
  MeaningYes: string;
  MeaningNo: string;
  VoteEnd: string;
}

interface ODataVoting {
  ID: number;
  Language: string;
  IdVote: number;
  RegistrationNumber: number;
  PersonNumber: number;
  FirstName: string;
  LastName: string;
  Canton: string;
  CantonName: string;
  ParlGroupCode: string;
  ParlGroupName: string;
  Decision: number;
  DecisionText: string;
  BusinessNumber: number;
  BusinessTitle: string;
  BillTitle: string;
  IdLegislativePeriod: number;
  IdSession: number;
  VoteEnd: string;
}

async function fetchODataPage(url: string): Promise<{ d: unknown[] }> {
  const resp = await fetch(url, {
    headers: { Accept: "application/json" },
  });
  if (!resp.ok) throw new Error(`OData fetch failed: ${resp.status} ${url}`);
  return resp.json();
}

async function syncVotes(supabase: ReturnType<typeof createClient>, logId: string): Promise<{ inserted: number; updated: number; fetched: number }> {
  let inserted = 0;
  const updated = 0;
  let fetched = 0;
  let skip = 0;

  while (true) {
    const url = `${ODATA_BASE}/Vote?$filter=IdLegislativePeriod%20eq%20${CURRENT_LEGISLATIVE_PERIOD}%20and%20Language%20eq%20'DE'&$top=${PAGE_SIZE}&$skip=${skip}&$format=json`;
    const data = await fetchODataPage(url);
    const records = data.d as ODataVote[];
    if (!records || records.length === 0) break;

    fetched += records.length;

    for (const r of records) {
      const row = {
        id_vote: r.ID,
        language: r.Language || "DE",
        registration_number: r.RegistrationNumber,
        business_number: r.BusinessNumber,
        business_short_number: r.BusinessShortNumber,
        business_title: r.BusinessTitle,
        bill_number: r.BillNumber,
        bill_title: r.BillTitle,
        id_legislative_period: r.IdLegislativePeriod,
        id_session: r.IdSession,
        session_name: r.SessionName,
        subject: r.Subject,
        meaning_yes: r.MeaningYes || null,
        meaning_no: r.MeaningNo || null,
        vote_end: parseMsDate(r.VoteEnd),
        raw_json: r,
        fetched_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("parliament_votes_raw")
        .upsert(row, { onConflict: "id_vote,language" });

      if (error) {
        console.error("Vote upsert error:", error.message);
      } else {
        inserted++;
      }
    }

    // Also upsert into parliamentary_votes for app consumption
    for (const r of records) {
      const voteRow = {
        vote_id: `CH-PARL-${r.ID}`,
        title_de: r.BusinessTitle || r.BillTitle || "Untitled",
        vote_date: parseMsDate(r.VoteEnd)?.split("T")[0] || null,
        chamber: "National Council",
        vote_category: r.Subject || null,
        policy_area: null,
        result: null,
        yes_count: 0,
        no_count: 0,
        abstain_count: 0,
        absent_count: 0,
        description: r.BillTitle || null,
      };

      await supabase
        .from("parliamentary_votes")
        .upsert(voteRow, { onConflict: "vote_id" });
    }

    if (records.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;

    // Update running log
    await supabase.from("data_sync_log").update({ records_fetched: fetched }).eq("id", logId);
  }

  return { inserted, updated, fetched };
}

async function syncVotings(supabase: ReturnType<typeof createClient>, logId: string): Promise<{ inserted: number; fetched: number }> {
  let inserted = 0, fetched = 0;
  let skip = 0;

  while (true) {
    const url = `${ODATA_BASE}/Voting?$filter=IdLegislativePeriod%20eq%20${CURRENT_LEGISLATIVE_PERIOD}%20and%20Language%20eq%20'DE'&$top=${PAGE_SIZE}&$skip=${skip}&$format=json`;
    const data = await fetchODataPage(url);
    const records = data.d as ODataVoting[];
    if (!records || records.length === 0) break;

    fetched += records.length;

    // Batch upsert into parliament_votings_raw
    const rows = records.map((r) => ({
      odata_id: r.ID,
      language: r.Language || "DE",
      id_vote: r.IdVote,
      registration_number: r.RegistrationNumber,
      person_number: r.PersonNumber,
      first_name: r.FirstName,
      last_name: r.LastName,
      canton: r.Canton,
      canton_name: r.CantonName,
      parl_group_code: r.ParlGroupCode,
      parl_group_name: r.ParlGroupName,
      decision: r.Decision,
      decision_text: r.DecisionText,
      business_number: r.BusinessNumber,
      business_title: r.BusinessTitle,
      bill_title: r.BillTitle,
      id_legislative_period: r.IdLegislativePeriod,
      id_session: r.IdSession,
      vote_end: parseMsDate(r.VoteEnd),
      raw_json: r,
      fetched_at: new Date().toISOString(),
    }));

    const { error } = await supabase
      .from("parliament_votings_raw")
      .upsert(rows, { onConflict: "odata_id,language" });

    if (error) {
      console.error("Votings batch upsert error:", error.message);
    } else {
      inserted += rows.length;
    }

    if (records.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;

    await supabase.from("data_sync_log").update({ records_fetched: fetched }).eq("id", logId);
  }

  return { inserted, fetched };
}

async function syncMembers(supabase: ReturnType<typeof createClient>): Promise<{ inserted: number; fetched: number }> {
  let inserted = 0, fetched = 0;
  let skip = 0;

  while (true) {
    const url = `${ODATA_BASE}/MemberCouncil?$filter=Language%20eq%20'DE'&$top=${PAGE_SIZE}&$skip=${skip}&$format=json`;
    const data = await fetchODataPage(url);
    const records = data.d as Record<string, unknown>[];
    if (!records || records.length === 0) break;

    fetched += records.length;

    for (const r of records) {
      const row = {
        person_number: r.PersonNumber as number,
        language: (r.Language as string) || "DE",
        first_name: r.FirstName as string,
        last_name: r.LastName as string,
        gender: r.GenderAsString as string,
        canton_abbreviation: r.CantonAbbreviation as string,
        council_abbreviation: r.CouncilAbbreviation as string,
        parl_group_code: r.ParlGroupAbbreviation as string,
        parl_group_name: r.ParlGroupName as string,
        party_abbreviation: r.PartyAbbreviation as string,
        party_name: r.PartyName as string,
        active: (r.Active as boolean) || false,
        date_of_birth: parseMsDate(r.DateOfBirth as string),
        date_joining: parseMsDate(r.DateJoining as string),
        date_leaving: parseMsDate(r.DateLeaving as string),
        mandates_text: r.Mandates as string,
        raw_json: r,
        fetched_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("parliament_members_raw")
        .upsert(row, { onConflict: "person_number,language" });

      if (!error) inserted++;
    }

    if (records.length < PAGE_SIZE) break;
    skip += PAGE_SIZE;
  }

  return { inserted, fetched };
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
  const mode = url.searchParams.get("mode") || "votes"; // votes | members | all

  // Create sync log entry
  const { data: logEntry } = await supabase
    .from("data_sync_log")
    .insert({
      source_name: `parlament.ch/${mode}`,
      sync_type: "incremental",
      status: "running",
    })
    .select("id")
    .single();

  const logId = logEntry?.id;

  try {
    const result: Record<string, unknown> = {};

    if (mode === "members" || mode === "all") {
      const membersResult = await syncMembers(supabase);
      result.members = membersResult;
    }

    if (mode === "votes" || mode === "all") {
      const votesResult = await syncVotes(supabase, logId);
      const votingsResult = await syncVotings(supabase, logId);
      result.votes = votesResult;
      result.votings = votingsResult;
    }

    const totalFetched = (
      ((result.members as { fetched: number } | undefined)?.fetched ?? 0) +
      ((result.votes as { fetched: number } | undefined)?.fetched ?? 0) +
      ((result.votings as { fetched: number } | undefined)?.fetched ?? 0)
    );

    // Update sync log to success
    await supabase.from("data_sync_log").update({
      status: "success",
      records_fetched: totalFetched,
      records_inserted: totalFetched,
      completed_at: new Date().toISOString(),
    }).eq("id", logId);

    return new Response(
      JSON.stringify({
        success: true,
        mode,
        legislative_period: CURRENT_LEGISLATIVE_PERIOD,
        result,
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
