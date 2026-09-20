const API_URL = "https://vudh-api.vudh-tech-0c8.workers.dev";

async function api(path, options = {}) {
  const response = await fetch(`${API_URL}${path}`, {
    ...options,
    credentials: "include",
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    }
  });

  let data = {};

  try {
    data = await response.json();
  } catch {}

  return { response, data };
}

async function handleSignup() {
  const form = document.getElementById("signup-form");

  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("message");

    const { response, data } = await api("/v1/auth/register", {
      method: "POST",
      body: JSON.stringify({
        username: document.getElementById("username").value.trim(),
        email: document.getElementById("email").value.trim(),
        password: document.getElementById("password").value
      })
    });

    if (!response.ok) {
      message.textContent = data.error || "Unable to create your account.";
      return;
    }

    form.reset();
    message.textContent = "Account created. Check your email to verify your account.";
  });
}

async function handleSignin() {
  const form = document.getElementById("signin-form");

  if (!form) return;

  form.addEventListener("submit", async event => {
    event.preventDefault();

    const message = document.getElementById("message");

    const { response, data } = await api("/v1/auth/login", {
      method: "POST",
      body: JSON.stringify({
        identifier: document.getElementById("identifier").value.trim(),
        password: document.getElementById("password").value
      })
    });

    if (!response.ok) {
      message.textContent = data.error || "Unable to sign in.";
      return;
    }

    window.location.href = "account.html";
  });
}

async function loadAccount() {
  const account = document.getElementById("account");
  const loading = document.getElementById("loading");

  if (!account || !loading) return;

  const { response, data } = await api("/v1/me");

  if (!response.ok) {
    window.location.href = "signin.html";
    return;
  }

  document.getElementById("username").textContent = data.user.username;
  document.getElementById("email").textContent = data.user.email;
  document.getElementById("verified").textContent = data.user.email_verified ? "Yes" : "No";

  loading.hidden = true;
  account.hidden = false;
}

async function handleSignout() {
  const signout = document.getElementById("signout");

  if (!signout) return;

  try {
    await api("/v1/auth/logout", {
      method: "POST"
    });
  } finally {
    window.location.href = "index.html";
  }
}

handleSignup();
handleSignin();
loadAccount();
handleSignout();