const statusEl = document.querySelector("#status");
const statusTextEl = document.querySelector("#statusText");
const latencyEl = document.querySelector("#latency");
const jitterEl = document.querySelector("#jitter");
const lossEl = document.querySelector("#loss");
const testButton = document.querySelector("#test");
const detailEl = document.querySelector("#detail");

const endpoint = "./functions/api/ping.js";

let boosted = false;

const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));

function setStatus(status, text) {
  statusEl.textContent = status;
  statusTextEl.textContent = text;
}

async function ping() {
  const start = performance.now();

  try {
    const response = await fetch(
      endpoint + "?t=" + Date.now() + "-" + Math.random(),
      { cache: "no-store" }
    );

    if (!response.ok) throw new Error();

    await response.text();
    return performance.now() - start;
  } catch {
    return null;
  }
}

async function measure(count = 10) {
  const samples = [];

  for (let i = 0; i < count; i++) {
    const value = await ping();

    if (value !== null) {
      samples.push(value);
    }

    await sleep(75);
  }

  if (!samples.length) {
    return {
      latency: null,
      jitter: null,
      loss: 100
    };
  }

  const latency =
    samples.reduce((sum, value) => sum + value, 0) /
    samples.length;

  const jitter =
    samples.length > 1
      ? samples.slice(1).reduce(
          (sum, value, i) =>
            sum + Math.abs(value - samples[i]),
          0
        ) / (samples.length - 1)
      : 0;

  return {
    latency,
    jitter,
    loss: ((count - samples.length) / count) * 100
  };
}

function display(result) {
  latencyEl.textContent =
    result.latency == null
      ? "—"
      : Math.round(result.latency) + " ms";

  jitterEl.textContent =
    result.jitter == null
      ? "—"
      : Math.round(result.jitter) + " ms";

  lossEl.textContent =
    (Number.isInteger(result.loss)
      ? result.loss
      : result.loss.toFixed(1)) + "%";
}

async function boostConnection() {
  testButton.disabled = true;

  setStatus("optimizing...", "warming the vudh connection");
  detailEl.textContent = "opening parallel edge requests";

  await Promise.allSettled(
    Array.from({ length: 8 }, ping)
  );

  await sleep(150);

  boosted = true;

  setStatus("boosted", "vudh connection is warm");
  detailEl.textContent =
    "browser traffic can reuse the warmed connection";

  display(await measure());

  testButton.disabled = false;
  testButton.textContent = "re-optimize";
}

async function testConnection() {
  testButton.disabled = true;

  if (!boosted) {
    setStatus("testing...", "measuring your connection");
    detailEl.textContent = "";

    const result = await measure();

    display(result);

    if (result.loss === 100) {
      setStatus(
        "offline?",
        "vudh could not reach its edge"
      );
    } else {
      setStatus(
        "online",
        "connection is reachable"
      );
    }

    testButton.textContent = "boost connection";
    testButton.disabled = false;
    return;
  }

  await boostConnection();
}

testButton.addEventListener(
  "click",
  testConnection
);