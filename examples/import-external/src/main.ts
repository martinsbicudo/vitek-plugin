const out = document.getElementById('out') as HTMLPreElement;

async function run() {
  try {
    const [health, version, item, deep] = await Promise.all([
      fetch('/api/health').then((r) => r.json()),
      fetch('/api/version').then((r) => r.json()),
      fetch('/api/items/42').then((r) => r.json()),
      fetch('/api/deep').then((r) => r.json()),
    ]);
    out.textContent = JSON.stringify({ health, version, item, deep }, null, 2);
  } catch (e) {
    out.textContent = `Error: ${e instanceof Error ? e.message : String(e)}`;
  }
}

run();
