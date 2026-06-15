const config = window.TRAINS_ADMIN_CONFIG;

const state = {
  session: readSession(),
  listeners: [],
  subscriptions: [],
};

const elements = {
  heroSignIn: document.querySelector("#hero-sign-in"),
  signOut: document.querySelector("#sign-out"),
  signedOutPanel: document.querySelector("#signed-out-panel"),
  adminPanel: document.querySelector("#admin-panel"),
  listenerForm: document.querySelector("#listener-form"),
  listenersList: document.querySelector("#listeners-list"),
  listenersEmpty: document.querySelector("#listeners-empty"),
  refreshListeners: document.querySelector("#refresh-listeners"),
  subscriptionForm: document.querySelector("#subscription-form"),
  listenerSelect: document.querySelector('[name="listenerId"]'),
  refreshSubscriptions: document.querySelector("#refresh-subscriptions"),
  subscriptionsBody: document.querySelector("#subscriptions-body"),
  subscriptionsEmpty: document.querySelector("#subscriptions-empty"),
  message: document.querySelector("#message"),
};

init().catch((error) => showMessage(error.message, true));

async function init() {
  if (!config) throw new Error("Missing admin config");

  elements.heroSignIn.addEventListener("click", signIn);
  elements.signOut.addEventListener("click", signOut);
  elements.listenerForm.addEventListener("submit", createListener);
  elements.subscriptionForm.addEventListener("submit", createSubscription);
  elements.refreshListeners.addEventListener("click", loadListeners);
  elements.refreshSubscriptions.addEventListener("click", loadSubscriptions);

  defaultSubscriptionDates();

  if (new URLSearchParams(window.location.search).has("code")) {
    await completeSignIn();
  }

  renderAuth();
  if (state.session) await refreshAll();
}

function readSession() {
  const raw = sessionStorage.getItem("trains.admin.session");
  if (!raw) return null;

  try {
    const session = JSON.parse(raw);
    if (!session.idToken || !session.expiresAt || Date.now() >= session.expiresAt) return null;
    return session;
  } catch {
    return null;
  }
}

function saveSession(session) {
  sessionStorage.setItem("trains.admin.session", JSON.stringify(session));
  state.session = session;
}

async function signIn() {
  const verifier = randomString(64);
  const challenge = await pkceChallenge(verifier);
  const authState = randomString(24);
  sessionStorage.setItem("trains.admin.pkce", JSON.stringify({ verifier, authState }));

  const params = new URLSearchParams({
    client_id: config.clientId,
    response_type: "code",
    scope: "openid email profile",
    redirect_uri: config.redirectUri,
    state: authState,
    code_challenge: challenge,
    code_challenge_method: "S256",
  });

  window.location.assign(`${config.cognitoDomain}/oauth2/authorize?${params.toString()}`);
}

async function completeSignIn() {
  const params = new URLSearchParams(window.location.search);
  const code = params.get("code");
  const incomingState = params.get("state");
  const pkce = JSON.parse(sessionStorage.getItem("trains.admin.pkce") ?? "{}");
  sessionStorage.removeItem("trains.admin.pkce");

  if (!code || !pkce.verifier || pkce.authState !== incomingState) {
    throw new Error("Unable to complete sign in");
  }

  const response = await fetch(`${config.cognitoDomain}/oauth2/token`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "authorization_code",
      client_id: config.clientId,
      code,
      redirect_uri: config.redirectUri,
      code_verifier: pkce.verifier,
    }),
  });

  if (!response.ok) throw new Error("Token exchange failed");
  const token = await response.json();
  saveSession({
    idToken: token.id_token,
    accessToken: token.access_token,
    expiresAt: Date.now() + Number(token.expires_in ?? 3600) * 1000,
  });

  window.history.replaceState({}, document.title, config.redirectUri);
}

function signOut() {
  sessionStorage.removeItem("trains.admin.session");
  state.session = null;
  renderAuth();
  const params = new URLSearchParams({
    client_id: config.clientId,
    logout_uri: config.redirectUri,
  });
  window.location.assign(`${config.cognitoDomain}/logout?${params.toString()}`);
}

function renderAuth() {
  const signedIn = Boolean(state.session);
  elements.signOut.hidden = !signedIn;
  elements.signedOutPanel.hidden = signedIn;
  elements.adminPanel.hidden = !signedIn;
}

async function refreshAll() {
  await Promise.all([loadListeners(), loadSubscriptions()]);
}

async function loadListeners() {
  const data = await apiFetch("/listeners");
  state.listeners = data.listeners ?? [];
  renderListeners();
}

function renderListeners() {
  elements.listenersList.replaceChildren();
  elements.listenerSelect.replaceChildren();
  elements.listenersEmpty.classList.toggle("is-visible", state.listeners.length === 0);

  for (const listener of state.listeners) {
    const option = document.createElement("option");
    option.value = listener.listenerId;
    option.textContent = `${listener.name} (${listener.listenerId})`;
    elements.listenerSelect.append(option);

    const item = document.createElement("article");
    item.className = "list-item";
    item.innerHTML = `
      <div class="list-title"></div>
      <div class="list-meta"></div>
      <div class="list-meta"></div>
    `;
    item.children[0].textContent = listener.name;
    item.children[1].textContent = listener.webhookUrl;
    item.children[2].textContent = listener.listenerId;
    elements.listenersList.append(item);
  }

  elements.subscriptionForm.querySelector('button[type="submit"]').disabled =
    state.listeners.length === 0;
}

async function createListener(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  await apiFetch("/listeners", {
    method: "POST",
    body: {
      name: form.get("name"),
      webhookUrl: form.get("webhookUrl"),
      webhookToken: form.get("webhookToken"),
    },
  });
  event.currentTarget.reset();
  await loadListeners();
  showMessage("Listener created");
}

async function loadSubscriptions() {
  const data = await apiFetch("/subscriptions");
  state.subscriptions = data.subscriptions ?? [];
  renderSubscriptions();
}

function renderSubscriptions() {
  elements.subscriptionsBody.replaceChildren();
  elements.subscriptionsEmpty.classList.toggle("is-visible", state.subscriptions.length === 0);

  for (const subscription of state.subscriptions) {
    const row = document.createElement("tr");
    const status = String(subscription.status ?? "UNKNOWN").toLowerCase();
    row.innerHTML = `
      <td>
        <div class="route">
          <span></span>
          <span class="muted"></span>
        </div>
      </td>
      <td></td>
      <td><span class="pill"></span></td>
      <td class="muted"></td>
      <td></td>
    `;

    row.querySelector(".route span:first-child").textContent =
      `${subscription.originTpl} -> ${subscription.destinationTpl}`;
    row.querySelector(".route .muted").textContent = subscription.listenerId;
    row.children[1].textContent = `${subscription.serviceDate} ${subscription.plannedDepartureTime}`;
    const pill = row.querySelector(".pill");
    pill.classList.add(status);
    pill.textContent = subscription.status;
    row.children[3].textContent =
      [subscription.latestRid, subscription.latestUid, subscription.lastNotifiedAt]
        .filter(Boolean)
        .join(" / ") || "No updates";

    if (subscription.active) {
      const cancel = document.createElement("button");
      cancel.className = "danger-button";
      cancel.type = "button";
      cancel.textContent = "Cancel";
      cancel.addEventListener("click", () => cancelSubscription(subscription.subscriptionId));
      row.children[4].append(cancel);
    }

    elements.subscriptionsBody.append(row);
  }
}

async function createSubscription(event) {
  event.preventDefault();
  const form = new FormData(event.currentTarget);
  const expiresAt = form.get("expiresAt");
  const body = {
    listenerId: form.get("listenerId"),
    originTpl: form.get("originTpl"),
    destinationTpl: form.get("destinationTpl"),
    serviceDate: form.get("serviceDate"),
    plannedDepartureTime: form.get("plannedDepartureTime"),
    timeWindowMinutes: Number(form.get("timeWindowMinutes") ?? 5),
  };

  if (expiresAt) {
    body.expiresAtEpochSeconds = Math.floor(new Date(expiresAt).getTime() / 1000);
  }

  await apiFetch("/subscriptions", { method: "POST", body });
  event.currentTarget.reset();
  defaultSubscriptionDates();
  await loadSubscriptions();
  showMessage("Subscription created");
}

async function cancelSubscription(subscriptionId) {
  await apiFetch(`/subscriptions/${encodeURIComponent(subscriptionId)}`, { method: "DELETE" });
  await loadSubscriptions();
  showMessage("Subscription cancelled");
}

async function apiFetch(path, options = {}) {
  if (!state.session) throw new Error("Sign in required");
  const response = await fetch(`${config.apiUrl}${path}`, {
    method: options.method ?? "GET",
    headers: {
      authorization: `Bearer ${state.session.idToken}`,
      ...(options.body ? { "content-type": "application/json" } : {}),
    },
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  if (response.status === 204) return {};

  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error ?? `Request failed: ${response.status}`);
  return data;
}

function defaultSubscriptionDates() {
  const today = new Date().toISOString().slice(0, 10);
  const serviceDate = elements.subscriptionForm.elements.serviceDate;
  const plannedDepartureTime = elements.subscriptionForm.elements.plannedDepartureTime;
  if (!serviceDate.value) serviceDate.value = today;
  if (!plannedDepartureTime.value) plannedDepartureTime.value = "19:26";
}

function showMessage(message, isError = false) {
  elements.message.textContent = message;
  elements.message.hidden = false;
  elements.message.classList.toggle("is-error", isError);
  window.setTimeout(() => {
    elements.message.hidden = true;
  }, 3500);
}

function randomString(length) {
  const values = new Uint8Array(length);
  crypto.getRandomValues(values);
  return Array.from(values, (value) => ("0" + (value % 36).toString(36)).slice(-1)).join("");
}

async function pkceChallenge(verifier) {
  const data = new TextEncoder().encode(verifier);
  const digest = await crypto.subtle.digest("SHA-256", data);
  return btoa(String.fromCharCode(...new Uint8Array(digest)))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}
