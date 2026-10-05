const statusEl = document.querySelector("#status");
const latencyEl = document.querySelector("#latency");
const jitterEl = document.querySelector("#jitter");
const lossEl = document.querySelector("#loss");
const testButton = document.querySelector("#test");

const endpoint = "./functions/api/ping.js";

let boosted = false;

function setStatus(text) {
  statusEl.textContent = text;
}

async function ping() {
  const start = performance.now();

  try {
    const response = await fetch(`${endpoint}?t=${Date.now()}`, {
      cache: "no-store"
    });

    if (!response.ok) throw new Error();

    await response.text();
    return performance.now() - start;
  } catch {
    return null;
  }
}

async function measure(count = 8) {
  const results = [];

  for (let i = 0; i < count; i++) {
    const result = await ping();

    if (result !== null) {
      results.push(result);
    }

    await new Promise(resolve => setTimeout(resolve, 100));
  }

  const packetLoss = ((count - results.length) / count) * 100;

  if (!results.length) {
    return {
      latency: null,
      jitter: null,
      loss: 100
    };
  }

  const latency =
    results.reduce((sum, value) => sum + value, 0) /
    results.length;

  const jitter =
    results.length > 1
      ? results.slice(1).reduce(
          (sum, value, i) =>
            sum + Math.abs(value - results[i]),
          0
        ) / (results.length - 1)
      : 0;

  return {
    latency,
    jitter,
    loss: packetLoss
  };
}

function display(result) {
  latencyEl.textContent =
    result.latency === null
      ? "—"
      : `${Math.round(result.latency)} ms`;

  jitterEl.textContent =
    result.jitter === null
      ? "—"
      : `${Math.round(result.jitter)} ms`;

  lossEl.textContent = `${result.loss}%`;
}

async function boostConnection() {
  testButton.disabled = true;
  setStatus("boosting...");

  // Warm up the connection.
  const warmups = [];

  for (let i = 0; i < 4; i++) {
    warmups.push(ping());
  }

  await Promise.allSettled(warmups);

  // Give the connection a moment to settle.
  await new Promise(resolve => setTimeout(resolve, 250));

  boosted = true;

  setStatus("boosted");

  const result = await measure();
  display(result);

  testButton.disabled = false;
}

async function testConnection() {
  testButton.disabled = true;

  if (!boosted) {
    setStatus("testing...");

    const result = await measure();
    display(result);

    if (result.loss === 100) {
      setStatus("offline?");
    } else {
      setStatus("online");
    }
  } else {
    await boostConnection();
  }

  testButton.disabled = false;
}

testButton.addEventListener("click", testConnection);