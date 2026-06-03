// Fetch real data from Swiss Parliament API
const API_BASE = 'https://ws-old.parlament.ch';

async function fetchCouncillors() {
  const response = await fetch(`${API_BASE}/councillors/basicdetails?format=json&lang=de`);
  const data = await response.json();
  return data;
}

async function fetchCommittees() {
  const response = await fetch(`${API_BASE}/committees?format=json&lang=de`);
  const data = await response.json();
  return data;
}

async function fetchParties() {
  const response = await fetch(`${API_BASE}/parties?format=json&lang=de`);
  const data = await response.json();
  return data;
}

// Execute and log results
async function main() {
  try {
    console.log('Fetching councillors...');
    const councillors = await fetchCouncillors();
    console.log('Councillors:', JSON.stringify(councillors, null, 2));

    console.log('\nFetching committees...');
    const committees = await fetchCommittees();
    console.log('Committees:', JSON.stringify(committees, null, 2));

    console.log('\nFetching parties...');
    const parties = await fetchParties();
    console.log('Parties:', JSON.stringify(parties, null, 2));
  } catch (error) {
    console.error('Error:', error);
  }
}

main();
