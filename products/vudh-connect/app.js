const $ = id => document.getElementById(id);
const els = {status:$("status"), statusText:$("statusText"), dot:$("statusDot"),
  latency:$("latency"), jitter:$("jitter"), loss:$("loss"), test:$("test"), detail:$("detail")};

function setState(kind, title, text) {
  els.dot.className = "dot " + kind;
  els.status.textContent = title;
  els.statusText.textContent = text;
}

async function sample() {
  const start = performance.now();
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 3000);
  try {
    const r = await fetch(`/api/ping?t=${Date.now()}`, {
      cache:"no-store", signal:controller.signal
    });
    if (!r.ok) throw new Error("server error");
    return performance.now() - start;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function run() {
  els.test.disabled = true;
  els.detail.textContent = "running 8 quick tests…";
  setState("busy","testing","measuring the connection");

  const samples = [];
  for (let i=0;i<8;i++) {
    samples.push(await sample());
    await new Promise(r => setTimeout(r, 120));
  }

  const good = samples.filter(x => x !== null);
  const loss = ((samples.length-good.length)/samples.length)*100;

  if (!good.length) {
    els.latency.textContent = "—";
    els.jitter.textContent = "—";
    els.loss.textContent = "100%";
    setState("bad","offline?","the test endpoint could not be reached");
    els.detail.textContent = "This checks the connection to vudh's test endpoint. A failure can also mean the endpoint is unavailable.";
    els.test.disabled = false;
    return;
  }

  const avg = good.reduce((a,b)=>a+b,0)/good.length;
  const jitter = good.length > 1
    ? good.slice(1).reduce((a,b,i)=>a+Math.abs(b-good[i]),0)/(good.length-1)
    : 0;

  els.latency.textContent = `${Math.round(avg)} ms`;
  els.jitter.textContent = `${Math.round(jitter)} ms`;
  els.loss.textContent = `${Math.round(loss)}%`;

  const bad = loss >= 20 || avg >= 250 || jitter >= 100;
  setState(bad ? "bad" : "good", bad ? "rough connection" : "connection looks good",
           bad ? "something is making the connection unstable" : "the connection is responding normally");
  els.detail.textContent = `${good.length}/${samples.length} requests completed. This is a diagnostic, not a guaranteed internet-speed measurement.`;
  els.test.disabled = false;
}

els.test.addEventListener("click", run);
