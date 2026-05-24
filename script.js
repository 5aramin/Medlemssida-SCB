const loginView = document.querySelector("#loginView");
const appView = document.querySelector("#appView");
const loginForm = document.querySelector("#loginForm");
const usernameInput = document.querySelector("#usernameInput");
const passwordInput = document.querySelector("#passwordInput");
const loginError = document.querySelector("#loginError");
const logoutBtn = document.querySelector("#logoutBtn");

const membersEl = document.querySelector("#members");
const emptyState = document.querySelector("#emptyState");
const memberCount = document.querySelector("#memberCount");
const template = document.querySelector("#memberTemplate");
const form = document.querySelector("#memberForm");
const searchInput = document.querySelector("#searchInput");
const resetBtn = document.querySelector("#resetBtn");
const filterInputs = [...document.querySelectorAll(".filter-panel input[type='checkbox']")];
const clearFiltersBtn = document.querySelector("#clearFiltersBtn");

const storageKey = "server-panel-members";
const sessionKey = "server-panel-authenticated";
const username = "Medlemsansvarig123";
const password = "SCBOFC123";

const defaultMembers = [
  {
    id: crypto.randomUUID(),
    name: "Kira Voss",
    discord: "294710382957",
    role: "Polismyndigheten",
    status: "Aktiv",
    patrols: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Dex Harlow",
    discord: "837461029384",
    role: "Räddningstjänst",
    status: "Inaktiv",
    patrols: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Nova Strauss",
    discord: "102938475612",
    role: "Sjukvården",
    status: "Aktiv",
    patrols: 0,
  },
  {
    id: crypto.randomUUID(),
    name: "Zane Mercer",
    discord: "571829304712",
    role: "Serverledning",
    status: "Aktiv",
    patrols: 0,
    inactivityWarning: false,
  },
];

let members = loadMembers();

function normalizeStatus(status) {
  return status === "Tillgänglig" ? "Ledig" : status;
}

function normalizeMember(member) {
  return {
    id: member.id || crypto.randomUUID(),
    name: member.name || "",
    discord: member.discord || "",
    role: member.role || "Civilperson",
    status: normalizeStatus(member.status || "Aktiv"),
    patrols: Number.isFinite(Number(member.patrols)) ? Number(member.patrols) : 0,
    inactivityWarning: Boolean(member.inactivityWarning),
  };
}

function loadMembers() {
  const saved = localStorage.getItem(storageKey);
  if (!saved) return defaultMembers.map(normalizeMember);

  try {
    const parsed = JSON.parse(saved);
    return Array.isArray(parsed) ? parsed.map(normalizeMember) : defaultMembers.map(normalizeMember);
  } catch {
    return defaultMembers.map(normalizeMember);
  }
}

function saveMembers() {
  localStorage.setItem(storageKey, JSON.stringify(members));
}

function showApp() {
  loginView.classList.add("hidden");
  appView.classList.remove("hidden");
  renderMembers();
}

function showLogin() {
  appView.classList.add("hidden");
  loginView.classList.remove("hidden");
  passwordInput.value = "";
  usernameInput.focus();
}

async function offerPasswordSave() {
  if (!("credentials" in navigator) || typeof PasswordCredential === "undefined") {
    return;
  }

  try {
    const credential = new PasswordCredential(loginForm);
    await navigator.credentials.store(credential);
  } catch {
    // Some browsers only show their built-in prompt and do not expose a result.
  }
}

function getFilteredMembers() {
  const query = searchInput.value.trim().toLowerCase();
  const selectedRoles = filterInputs
    .filter((input) => input.name === "role" && input.checked)
    .map((input) => input.value);
  const selectedStatuses = filterInputs
    .filter((input) => input.name === "status" && input.checked)
    .map((input) => input.value);
  const warningOnly = document.querySelector("#warningFilter").checked;
  const patrolOnly = document.querySelector("#patrolFilter").checked;

  return members.filter((member) => {
    const matchesSearch =
      member.name.toLowerCase().includes(query) ||
      member.discord.toLowerCase().includes(query);
    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(member.role);
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(member.status);
    const matchesWarning = !warningOnly || member.inactivityWarning;
    const matchesPatrols = !patrolOnly || member.patrols > 0;

    return matchesSearch && matchesRole && matchesStatus && matchesWarning && matchesPatrols;
  });
}

function setStatus(member, status) {
  member.status = status;
  saveMembers();
  renderMembers();
}

function renderMembers() {
  const filteredMembers = getFilteredMembers();
  membersEl.innerHTML = "";
  memberCount.textContent = `${filteredMembers.length} / ${members.length}`;
  emptyState.classList.toggle("hidden", filteredMembers.length !== 0);

  filteredMembers.forEach((member) => {
    const node = template.content.cloneNode(true);
    const card = node.querySelector(".member-card");
    const dot = node.querySelector(".status-dot");
    const warningButton = node.querySelector(".inactivity-warning");

    card.dataset.memberId = member.id;
    card.classList.toggle("has-warning", member.inactivityWarning);
    node.querySelector(".member-name").textContent = member.name;
    node.querySelector(".member-role").textContent = member.role;
    node.querySelector(".member-discord").textContent = member.discord;
    node.querySelector(".member-patrols").textContent = member.patrols;
    dot.dataset.status = member.status;

    node.querySelector(".patrol-plus").addEventListener("click", () => {
      member.patrols += 1;
      saveMembers();
      renderMembers();
    });

    node.querySelector(".patrol-minus").addEventListener("click", () => {
      member.patrols = Math.max(0, member.patrols - 1);
      saveMembers();
      renderMembers();
    });

    node.querySelector(".remove").addEventListener("click", () => {
      members = members.filter((item) => item.id !== member.id);
      saveMembers();
      renderMembers();
    });

    warningButton.classList.toggle("is-active", member.inactivityWarning);
    warningButton.addEventListener("click", () => {
      member.inactivityWarning = !member.inactivityWarning;
      saveMembers();
      renderMembers();
    });

    const activeButton = node.querySelector(".status-active");
    const inactiveButton = node.querySelector(".status-inactive");
    const availableButton = node.querySelector(".status-available");

    activeButton.classList.toggle("is-selected", member.status === "Aktiv");
    inactiveButton.classList.toggle("is-selected", member.status === "Inaktiv");
    availableButton.classList.toggle("is-selected", member.status === "Ledig");

    activeButton.addEventListener("click", () => setStatus(member, "Aktiv"));
    inactiveButton.addEventListener("click", () => setStatus(member, "Inaktiv"));
    availableButton.addEventListener("click", () => setStatus(member, "Ledig"));

    membersEl.append(node);
  });
}

loginForm.addEventListener("submit", async (event) => {
  event.preventDefault();

  const validLogin = usernameInput.value.trim() === username && passwordInput.value === password;
  if (!validLogin) {
    loginError.textContent = "Fel användarnamn eller lösenord.";
    return;
  }

  loginError.textContent = "";
  await offerPasswordSave();
  localStorage.setItem(sessionKey, "true");
  showApp();
});

logoutBtn.addEventListener("click", () => {
  localStorage.removeItem(sessionKey);
  showLogin();
});

form.addEventListener("submit", (event) => {
  event.preventDefault();

  const formData = normalizeMember({
    name: document.querySelector("#nameInput").value.trim(),
    discord: document.querySelector("#discordInput").value.trim(),
    role: document.querySelector("#roleInput").value,
    status: document.querySelector("#statusInput").value,
    patrols: 0,
  });

  if (!formData.name || !formData.discord) return;

  members.unshift(formData);
  saveMembers();
  form.reset();
  document.querySelector("#statusInput").value = "Aktiv";
  document.querySelector("#roleInput").value = "Civilperson";
  renderMembers();
});

searchInput.addEventListener("input", renderMembers);
filterInputs.forEach((input) => input.addEventListener("change", renderMembers));

clearFiltersBtn.addEventListener("click", () => {
  filterInputs.forEach((input) => {
    input.checked = false;
  });
  renderMembers();
});

resetBtn.addEventListener("click", () => {
  members = members.map((member) => ({
    ...member,
    patrols: 0,
  }));
  saveMembers();
  renderMembers();
});

if (localStorage.getItem(sessionKey) === "true") {
  showApp();
} else {
  showLogin();
}
