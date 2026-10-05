const statusEl = document.querySelector("#status");
const latencyEl = document.querySelector("#latency");
const jitterEl = document.querySelector("#jitter");
const lossEl = document.querySelector("#loss");
const testButton = document.querySelector("#test");

const endpoint = "./functions/api/ping.js";

function setStatus(text) {
  statusEl.textContent = text;
}

async function ping() {
  const start = performance.now();

  try {
    const response = await fetch(`${endpoint}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }

    await response.text();

    return performance.now() - start;
  } catch {
    return null;
  }
}

async function testConnection() {
  testButton.disabled = true;
  setStatus("testing...");
  latencyEl.textContent = "—";
  jitterEl.textContent = "—";
  lossEl.textContent = "—";

  const results = [];

  for (let i = 0; i < 8; i++) {
    const result = await ping();

    if (result !== null) {
      results.push(result);
    }

    await new Promise(resolve => setTimeout(resolve, 150));
  }

  const packetLoss = ((8 - results.length) / 8) * 100;

  lossEl.textContent = `${packetLoss}%`;

  if (results.length === 0) {
    setStatus("offline?");
    testButton.disabled = false;
    return;
  }

  const average =
    results.reduce((sum, value) => sum + value, 0) / results.length;

  const jitter =
    results.length > 1
      ? results
          .slice(1)
          .reduce((sum, value, i) => {
            return sum + Math.abs(value - results[i]);
          }, 0) / (results.length - 1)
      : 0;

  latencyEl.textContent = `${Math.round(average)} ms`;
  jitterEl.textContent = `${Math.round(jitter)} ms`;

  if (packetLoss === 0) {
    setStatus("online");
  } else {
    setStatus("unstable");
  }

  testButton.disabled = false;
}

testButton.addEventListener("click", testConnection);