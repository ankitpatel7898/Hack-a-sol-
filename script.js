
// ======================================
// HEALTHGUARD - MAIN JAVASCRIPT
// ======================================

// Store claims in browser storage
let claims = JSON.parse(localStorage.getItem("healthguardClaims")) || [];

let consentSettings = {
  medical: true,
  identity: true,
  insurance: false
};

let notifications = [
  "Your claim HS-2026-001 has been approved.",
  "Zero-knowledge proof successfully generated.",
  "New claim submitted for verification."
];

/* NAVIGATION */

const navigation = {
  patient: [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "claims", label: "My Claims", icon: "▤" },
    { id: "privacy", label: "Privacy & Consent", icon: "♧" },
    { id: "activity", label: "Activity", icon: "◷" }
  ],
  hospital: [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "claims", label: "Claims Management", icon: "▤" },
    { id: "submit", label: "Submit Claim", icon: "+" },
    { id: "activity", label: "Activity", icon: "◷" }
  ],
  insurer: [
    { id: "dashboard", label: "Dashboard", icon: "⌂" },
    { id: "claims", label: "Review Claims", icon: "▤" },
    { id: "analytics", label: "Analytics", icon: "▥" },
    { id: "activity", label: "Blockchain Activity", icon: "◷" }
  ]
};

/* LOADING ANIMATION */

function startLoader() {
  const loader = $("#loader");

  if (!loader) {
    showLogin();
    return;
  }

  const bar = $("#loadBar");
  const percent = $("#loadPercent");
  const loadText = $("#loadText");

  const messages = [
    "Securing your healthcare environment",
    "Initializing privacy protection",
    "Verifying secure connection",
    "Preparing your dashboard",
    "Welcome to HealthShield"
  ];

  let progress = 0;

  const interval = setInterval(() => {
    progress += Math.floor(Math.random() * 5) + 2;
    progress = Math.min(progress, 100);

    if (bar) bar.style.width = `${progress}%`;

    if (percent) {
      percent.textContent =
        `${String(progress).padStart(2, "0")}%`;
    }

    if (loadText) {
      const index = Math.min(
        Math.floor(progress / 25),
        messages.length - 1
      );
      loadText.textContent = messages[index];
    }

    if (progress >= 100) {
      clearInterval(interval);

      setTimeout(() => {
        loader.classList.add("loader-hidden");

        setTimeout(() => {
          loader.style.display = "none";
          showLogin();
        }, 700);
      }, 400);
    }
  }, 110);
}

/* LOGIN */

function showLogin() {
  const login = $("#loginScreen");
  const app = $("#app");

  if (login) login.style.display = "flex";
  if (app) app.style.display = "none";
}

function loginUser(role) {
  if (!navigation[role]) return;

  currentRole = role;
  activePage = "dashboard";

  const login = $("#loginScreen");
  const app = $("#app");

  if (login) login.style.display = "none";
  if (app) app.style.display = "flex";

  updateUserDetails();
  renderPage();
}

function updateUserDetails() {
  const name = $("#userName");
  const role = $("#userRole");
  const avatar = $("#userAvatar");

  if (name) name.textContent = currentUser[currentRole];

  if (role) {
    role.textContent =
      currentRole.charAt(0).toUpperCase() + currentRole.slice(1);
  }

  if (avatar) {
    avatar.textContent = currentUser[currentRole]
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2);
  }
}

/* HELPERS */

function formatMoney(amount) {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0
  }).format(amount);
}

function statusClass(status) {
  return status.toLowerCase().replace(/\s+/g, "-");
}

function getRoleClaims() {
  if (currentRole === "patient") {
    return claims.filter(
      (claim) => claim.patient === currentUser.patient
    );
  }

  if (currentRole === "hospital") {
    return claims.filter(
      (claim) => claim.hospital === currentUser.hospital
    );
  }

  return claims;
}

function getCounts(data) {
  return {
    total: data.length,
    approved: data.filter(c => c.status === "Approved").length,
    pending: data.filter(c => c.status === "Pending").length,
    rejected: data.filter(c => c.status === "Rejected").length
  };
}

function statCard(title, value, subtitle, icon) {
  return `
    <div class="stat-card">
      <div class="stat-card-top">
        <span class="stat-label">${title}</span>
        <span class="stat-icon">${icon}</span>
      </div>
      <h2>${value}</h2>
      <p>${subtitle}</p>
    </div>
  `;
}

function claimTable(data, showActions = false) {
  if (!data.length) {
    return `<div class="empty-state">No claims available right now.</div>`;
  }

  return `
    <div class="table-wrapper">
      <table class="data-table">
        <thead>
          <tr>
            <th>Claim ID</th>
            <th>Patient</th>
            <th>Treatment</th>
            <th>Amount</th>
            <th>Status</th>
            ${showActions ? "<th>Action</th>" : ""}
          </tr>
        </thead>
        <tbody>
          ${data.map(claim => `
            <tr>
              <td><strong>${claim.id}</strong></td>
              <td>${claim.patient}</td>
              <td>${claim.treatment}</td>
              <td>${formatMoney(claim.amount)}</td>
              <td>
                <span class="status-badge ${statusClass(claim.status)}">
                  ${claim.status}
                </span>
              </td>
              ${showActions ? `
                <td>
                  ${claim.status === "Pending" ? `
                    <button class="action-btn approve-btn"
                      data-action="approve" data-id="${claim.id}">
                      Approve
                    </button>
                    <button class="action-btn reject-btn"
                      data-action="reject" data-id="${claim.id}">
                      Reject
                    </button>
                  ` : "—"}
                </td>
              ` : ""}
            </tr>
          `).join("")}
        </tbody>
      </table>
    </div>
  `;
}

/* SIDEBAR */

function renderSidebar() {
  const sidebar = $("#sidebarNav");
  if (!sidebar) return;

  sidebar.innerHTML = navigation[currentRole].map(item => `
    <button class="nav-item ${activePage === item.id ? "active" : ""}"
      data-page="${item.id}">
      <span class="nav-icon">${item.icon}</span>
      <span>${item.label}</span>
    </button>
  `).join("");
}

/* PAGE RENDERING */

function renderPage() {
  renderSidebar();

  const content = $("#pageContent");
  const title = $("#currentPage");

  if (!content) return;

  const pages = {
    dashboard: renderDashboard,
    claims: renderClaimsPage,
    privacy: renderPrivacyPage,
    submit: renderSubmitPage,
    analytics: renderAnalyticsPage,
    activity: renderActivityPage
  };

  const renderer = pages[activePage] || renderDashboard;

  content.innerHTML = renderer();

  if (title) {
    title.textContent =
      activePage.charAt(0).toUpperCase() + activePage.slice(1);
  }

  bindPageEvents();

  if (currentRole === "insurer" && activePage === "analytics") {
    bindChartFilters();
  }
}

/* PATIENT DASHBOARD */

function renderPatientDashboard() {
  const data = getRoleClaims();
  const counts = getCounts(data);

  const totalAmount = data
    .filter(c => c.status === "Approved")
    .reduce((sum, c) => sum + c.amount, 0);

  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">PATIENT PORTAL</p>
        <h1>Welcome back, Aarav 👋</h1>
        <p>Manage your healthcare claims and privacy settings.</p>
      </div>
      <button class="primary-btn" data-page-jump="privacy">
        Manage Privacy
      </button>
    </section>

    <div class="stats-grid">
      ${statCard("Total Claims", counts.total, "Your submitted claims", "▤")}
      ${statCard("Approved", counts.approved, "Successfully processed", "✓")}
      ${statCard("Pending", counts.pending, "Awaiting verification", "◷")}
      ${statCard("Covered Amount", formatMoney(totalAmount), "Approved claims", "₹")}
    </div>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h3>Recent Claims</h3>
          <p>Track your healthcare insurance requests.</p>
        </div>
        <button class="text-btn" data-page-jump="claims">View all</button>
      </div>
      ${claimTable(data.slice(0, 4))}
    </section>

    <section class="privacy-highlight">
      <div class="privacy-symbol">♧</div>
      <div>
        <h3>Your medical data stays private</h3>
        <p>Zero-knowledge proofs can verify eligibility without exposing sensitive medical details.</p>
      </div>
      <span class="secure-label">Privacy First</span>
    </section>
  `;
}

/* HOSPITAL DASHBOARD */

function renderHospitalDashboard() {
  const data = getRoleClaims();
  const counts = getCounts(data);

  const pendingAmount = data
    .filter(c => c.status === "Pending")
    .reduce((sum, c) => sum + c.amount, 0);

  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">HOSPITAL PORTAL</p>
        <h1>Hospital Overview</h1>
        <p>Submit and monitor insurance claims securely.</p>
      </div>
      <button class="primary-btn" data-page-jump="submit">
        + Submit New Claim
      </button>
    </section>

    <div class="stats-grid">
      ${statCard("Total Claims", counts.total, "Submitted by hospital", "▤")}
      ${statCard("Approved", counts.approved, "Claims accepted", "✓")}
      ${statCard("Pending", counts.pending, "Awaiting insurer review", "◷")}
      ${statCard("Pending Value", formatMoney(pendingAmount), "Under review", "₹")}
    </div>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h3>Recent Submissions</h3>
          <p>Overview of hospital claim activity.</p>
        </div>
        <button class="text-btn" data-page-jump="claims">View all</button>
      </div>
      ${claimTable(data.slice(0, 5))}
    </section>

    <section class="privacy-highlight">
      <div class="privacy-symbol">✚</div>
      <div>
        <h3>Secure claim submission</h3>
        <p>Submit treatment and billing details for verification.</p>
      </div>
      <span class="secure-label">Secure Workflow</span>
    </section>
  `;
}

/* INSURER DASHBOARD */

function renderInsurerDashboard() {
  const data = getRoleClaims();
  const counts = getCounts(data);

  const totalValue = data.reduce((sum, c) => sum + c.amount, 0);

  const pendingValue = data
    .filter(c => c.status === "Pending")
    .reduce((sum, c) => sum + c.amount, 0);

  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">INSURANCE ADMINISTRATION</p>
        <h1>Claims Intelligence</h1>
        <p>Review, verify and manage insurance claims.</p>
      </div>
      <span class="secure-label">System Operational</span>
    </section>

    <div class="stats-grid">
      ${statCard("Total Claims", counts.total, "Across the platform", "▤")}
      ${statCard("Approved", counts.approved, "Verified claims", "✓")}
      ${statCard("Pending Review", counts.pending, "Require attention", "◷")}
      ${statCard("Total Claim Value", formatMoney(totalValue), "All submitted claims", "₹")}
    </div>

    <div class="dashboard-grid">
      <section class="content-panel">
        <div class="panel-heading">
          <div>
            <h3>Claims Requiring Review</h3>
            <p>Verify submitted claims before processing.</p>
          </div>
        </div>
        ${claimTable(data.filter(c => c.status === "Pending"), true)}
      </section>

      <section class="content-panel">
        <div class="panel-heading">
          <div>
            <h3>Verification Summary</h3>
            <p>Current claim distribution.</p>
          </div>
        </div>
        ${renderDonut(counts)}
      </section>
    </div>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h3>Financial Overview</h3>
          <p>Pending claim value: ${formatMoney(pendingValue)}</p>
        </div>
        <button class="text-btn" data-page-jump="analytics">View analytics</button>
      </div>

      <div class="financial-strip">
        <div>
          <span>Approved</span>
          <strong>${formatMoney(data.filter(c => c.status === "Approved").reduce((s,c) => s+c.amount,0))}</strong>
        </div>
        <div><span>Pending</span><strong>${formatMoney(pendingValue)}</strong></div>
        <div>
          <span>Rejected</span>
          <strong>${formatMoney(data.filter(c => c.status === "Rejected").reduce((s,c) => s+c.amount,0))}</strong>
        </div>
      </div>
    </section>
  `;
}

function renderDashboard() {
  if (currentRole === "patient") return renderPatientDashboard();
  if (currentRole === "hospital") return renderHospitalDashboard();
  return renderInsurerDashboard();
}

/* CLAIMS PAGE */

function renderClaimsPage() {
  const data = getRoleClaims();

  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">CLAIM MANAGEMENT</p>
        <h1>${currentRole === "insurer" ? "Review Claims" : "My Claims"}</h1>
        <p>Monitor the status of submitted healthcare claims.</p>
      </div>
      ${currentRole === "hospital"
        ? `<button class="primary-btn" data-page-jump="submit">+ New Claim</button>`
        : ""}
    </section>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h3>All Claims</h3>
          <p>${data.length} records found</p>
        </div>
        <input type="search" id="claimSearch" placeholder="Search claims...">
      </div>
      <div id="claimsTableContainer">
        ${claimTable(data, currentRole === "insurer")}
      </div>
    </section>
  `;
}

/* SUBMIT CLAIM PAGE */

function renderSubmitPage() {
  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">HOSPITAL WORKSPACE</p>
        <h1>Submit a New Claim</h1>
        <p>Enter the required claim information.</p>
      </div>
    </section>

    <section class="content-panel form-panel">
      <form id="claimForm">
        <div class="form-grid">
          <div class="form-group">
            <label>Patient Name</label>
            <input type="text" name="patient" placeholder="Enter patient name" required>
          </div>

          <div class="form-group">
            <label>Hospital Name</label>
            <input type="text" name="hospital" value="${currentUser.hospital}" required>
          </div>

          <div class="form-group">
            <label>Treatment / Procedure</label>
            <input type="text" name="treatment" placeholder="e.g. Diagnostic Tests" required>
          </div>

          <div class="form-group">
            <label>Claim Amount (₹)</label>
            <input type="number" name="amount" min="1" placeholder="Enter amount" required>
          </div>
        </div>

        <div class="form-group">
          <label>Additional Notes</label>
          <textarea name="notes" rows="4" placeholder="Enter relevant claim information"></textarea>
        </div>

        <div class="proof-info">
          <span>♧</span>
          <div>
            <strong>Privacy-preserving verification</strong>
            <p>A simulated zero-knowledge proof will be generated for this demo.</p>
          </div>
        </div>

        <button type="submit" class="primary-btn">
          Generate Proof & Submit Claim
        </button>
      </form>
    </section>
  `;
}

/* PRIVACY PAGE */

function renderConsentRow(key, title, description) {
  return `
    <div class="consent-row">
      <div>
        <strong>${title}</strong>
        <p>${description}</p>
      </div>
      <label class="switch">
        <input type="checkbox" data-consent="${key}"
          ${consentSettings[key] ? "checked" : ""}>
        <span class="switch-slider"></span>
      </label>
    </div>
  `;
}

function renderPrivacyPage() {
  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">DATA PROTECTION</p>
        <h1>Privacy & Consent</h1>
        <p>Manage the information you allow to be shared.</p>
      </div>
    </section>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h3>Data Sharing Permissions</h3>
          <p>Change these settings at any time in this demo.</p>
        </div>
        <span class="secure-label">User Controlled</span>
      </div>

      ${renderConsentRow("medical", "Medical Records", "Allow verification of relevant treatment information.")}
      ${renderConsentRow("identity", "Identity Information", "Allow identity verification for claim processing.")}
      ${renderConsentRow("insurance", "Insurance Details", "Allow access to insurance policy information.")}
    </section>

    <section class="privacy-highlight">
      <div class="privacy-symbol">♧</div>
      <div>
        <h3>Zero-Knowledge Proofs</h3>
        <p>ZK proofs can demonstrate that a condition is satisfied without revealing underlying data.</p>
      </div>
    </section>
  `;
}

/* ACTIVITY PAGE */

function renderActivityPage() {
  const data = getRoleClaims();

  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">SYSTEM MONITORING</p>
        <h1>${currentRole === "insurer" ? "Blockchain Activity" : "Recent Activity"}</h1>
        <p>Review recent events and verification records.</p>
      </div>
    </section>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h3>Activity Timeline</h3>
          <p>Demo transaction records.</p>
        </div>
        <span class="secure-label">Demo Network</span>
      </div>

      <div class="timeline">
        ${data.slice().reverse().map(claim => `
          <div class="timeline-item">
            <div class="timeline-dot"></div>
            <div>
              <strong>${claim.id}</strong>
              <p>${claim.treatment} — ${claim.status}</p>
              <small>${claim.date} · Transaction: ${claim.hash}</small>
            </div>
            <span class="status-badge ${statusClass(claim.status)}">
              ${claim.status}
            </span>
          </div>
        `).join("")}
      </div>
    </section>
  `;
}

/* ANALYTICS */

const chartData = {
  "7D": {
    labels: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    values: [12, 18, 14, 26, 21, 34, 29]
  },
  "30D": {
    labels: ["Week 1", "Week 2", "Week 3", "Week 4"],
    values: [42, 65, 53, 88]
  },
  "6M": {
    labels: ["Jun", "Jul", "Aug", "Sep", "Oct", "Nov"],
    values: [35, 48, 44, 69, 62, 91]
  }
};

function renderAnalyticsPage() {
  const counts = getCounts(getRoleClaims());

  return `
    <section class="welcome-section">
      <div>
        <p class="eyebrow">INSIGHTS & REPORTS</p>
        <h1>Claims Analytics</h1>
        <p>Understand claim trends and verification performance.</p>
      </div>
      <span class="secure-label">Illustrative Demo Data</span>
    </section>

    <div class="stats-grid">
      ${statCard("Total Claims", counts.total, "Platform records", "▤")}
      ${statCard("Approved", counts.approved, "Accepted claims", "✓")}
      ${statCard("Pending", counts.pending, "Awaiting review", "◷")}
      ${statCard("Rejected", counts.rejected, "Not approved", "×")}
    </div>

    <div class="analytics-grid">
      <section class="content-panel analytics-panel">
        <div class="panel-heading">
          <div>
            <h3>Claim Submission Trends</h3>
            <p>Illustrative activity across selected periods.</p>
          </div>
          <div class="chart-filters">
            <button class="chart-filter active" data-range="7D">7D</button>
            <button class="chart-filter" data-range="30D">30D</button>
            <button class="chart-filter" data-range="6M">6M</button>
          </div>
        </div>
        <div id="modernChart"></div>
      </section>

      <section class="content-panel">
        <div class="panel-heading">
          <div>
            <h3>Claim Distribution</h3>
            <p>Current status breakdown.</p>
          </div>
        </div>
        ${renderDonut(counts)}
      </section>
    </div>

    <section class="content-panel">
      <div class="panel-heading">
        <div>
          <h3>Verification Performance</h3>
          <p>Based on the current demo records.</p>
        </div>
      </div>
      <div class="financial-strip">
        <div><span>Approved</span><strong>${counts.approved}</strong></div>
        <div><span>Pending</span><strong>${counts.pending}</strong></div>
        <div><span>Rejected</span><strong>${counts.rejected}</strong></div>
      </div>
    </section>
  `;
}

/* LINE CHART */

function drawModernChart(range = "7D") {
  const container = $("#modernChart");
  if (!container) return;

  const dataset = chartData[range];
  const values = dataset.values;
  const labels = dataset.labels;

  const width = 700;
  const height = 280;
  const padding = { top: 25, right: 25, bottom: 45, left: 40 };
  const maxValue = Math.max(...values) * 1.2;

  const x = index =>
    padding.left +
    (index / Math.max(values.length - 1, 1)) *
    (width - padding.left - padding.right);

  const y = value =>
    height - padding.bottom -
    (value / maxValue) *
    (height - padding.top - padding.bottom);

  const points = values.map((value, index) => ({
    x: x(index),
    y: y(value),
    value,
    label: labels[index]
  }));

  const linePath = points.map((point, index) =>
    `${index === 0 ? "M" : "L"} ${point.x} ${point.y}`
  ).join(" ");

  const last = points[points.length - 1];
  const first = points[0];

  const areaPath =
    `${linePath} L ${last.x} ${height - padding.bottom} ` +
    `L ${first.x} ${height - padding.bottom} Z`;

  const gridLines = [0, .25, .5, .75, 1].map(fraction => {
    const gridY =
      padding.top +
      fraction * (height - padding.top - padding.bottom);

    return `
      <line x1="${padding.left}" y1="${gridY}"
        x2="${width - padding.right}" y2="${gridY}"
        class="chart-grid-line"/>
      <text x="${padding.left - 12}" y="${gridY + 4}"
        text-anchor="end" class="chart-axis-label">
        ${Math.round(maxValue * (1 - fraction))}
      </text>
    `;
  }).join("");

  const dots = points.map(point => `
    <circle cx="${point.x}" cy="${point.y}" r="11"
      class="chart-dot-halo"/>
    <circle cx="${point.x}" cy="${point.y}" r="5"
      class="chart-dot">
      <title>${point.label}: ${point.value} claims</title>
    </circle>
    <text x="${point.x}" y="${height - 15}"
      text-anchor="middle" class="chart-axis-label">
      ${point.label}
    </text>
  `).join("");

  container.innerHTML = `
    <div class="chart-summary">
      <div>
        <span class="chart-summary-label">Total activity</span>
        <strong>${values.reduce((sum, value) => sum + value, 0)}</strong>
      </div>
      <span class="chart-trend">Illustrative data</span>
    </div>

    <svg class="modern-line-chart" viewBox="0 0 ${width} ${height}">
      <defs>
        <linearGradient id="chartGradient" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stop-color="#20b7a5" stop-opacity=".27"/>
          <stop offset="100%" stop-color="#20b7a5" stop-opacity=".01"/>
        </linearGradient>
      </defs>

      ${gridLines}
      <path d="${areaPath}" class="chart-area" fill="url(#chartGradient)"/>
      <path d="${linePath}" class="chart-curve"/>
      ${dots}
    </svg>
  `;
}

function bindChartFilters() {
  drawModernChart("7D");

  document.querySelectorAll("[data-range]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-range]").forEach(btn =>
        btn.classList.remove("active")
      );

      button.classList.add("active");
      drawModernChart(button.dataset.range);
    });
  });
}

/* DONUT CHART */

function renderDonut(counts) {
  const total = counts.total || 1;

  const approved = counts.approved / total * 100;
  const pending = counts.pending / total * 100;
  const pendingEnd = approved + pending;

  return `
    <div class="donut-wrapper">
      <div class="donut-chart"
        style="background:conic-gradient(
          #18a999 0% ${approved}%,
          #f0b84b ${approved}% ${pendingEnd}%,
          #e47c86 ${pendingEnd}% 100%
        )">
        <div class="donut-inner">
          <strong>${counts.total}</strong>
          <span>Total Claims</span>
        </div>
      </div>

      <div class="donut-legend">
        <div><span class="legend-dot approved-dot"></span>
          Approved <strong>${counts.approved}</strong></div>
        <div><span class="legend-dot pending-dot"></span>
          Pending <strong>${counts.pending}</strong></div>
        <div><span class="legend-dot rejected-dot"></span>
          Rejected <strong>${counts.rejected}</strong></div>
      </div>
    </div>
  `;
}

/* CLAIM SUBMISSION */

function submitClaim(form) {
  const formData = new FormData(form);

  const patient = String(formData.get("patient") || "").trim();
  const hospital = String(formData.get("hospital") || "").trim();
  const treatment = String(formData.get("treatment") || "").trim();
  const amount = Number(formData.get("amount"));

  if (!patient || !hospital || !treatment || !Number.isFinite(amount) || amount <= 0) {
    alert("Please enter valid claim details.");
    return;
  }

  const newClaim = {
    id: `HS-2026-${String(claims.length + 1).padStart(3, "0")}`,
    patient,
    hospital,
    treatment,
    amount,
    status: "Pending",
    date: new Date().toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric"
    }),
    proof: "Generated",
    hash: `0x${Math.random().toString(16).slice(2, 10)}`
  };

  claims.unshift(newClaim);

  notifications.unshift(
    `New claim ${newClaim.id} submitted with simulated proof.`
  );

  alert(
    `Claim submitted successfully!\nClaim ID: ${newClaim.id}\nSimulated proof generated.`
  );

  activePage = "claims";
  renderPage();
}

/* CLAIM APPROVAL / REJECTION */

function updateClaimStatus(id, status) {
  const claim = claims.find(item => item.id === id);
  if (!claim) return;

  claim.status = status;
  notifications.unshift(
    `Claim ${id} has been ${status.toLowerCase()}.`
  );

  renderPage();
}

/* EVENT BINDING */

function bindPageEvents() {
  document.querySelectorAll("[data-page-jump]").forEach(button => {
    button.addEventListener("click", () => {
      activePage = button.dataset.pageJump;
      renderPage();
    });
  });

  const form = $("#claimForm");

  if (form) {
    form.addEventListener("submit", event => {
      event.preventDefault();
      submitClaim(form);
    });
  }

  document.querySelectorAll("[data-action]").forEach(button => {
    button.addEventListener("click", () => {
      const id = button.dataset.id;
      const action = button.dataset.action;

      if (action === "approve") updateClaimStatus(id, "Approved");
      if (action === "reject") updateClaimStatus(id, "Rejected");
    });
  });

  document.querySelectorAll("[data-consent]").forEach(checkbox => {
    checkbox.addEventListener("change", () => {
      consentSettings[checkbox.dataset.consent] = checkbox.checked;

      notifications.unshift(
        `${checkbox.dataset.consent} permission ${
          checkbox.checked ? "enabled" : "disabled"
        }.`
      );
    });
  });

  const search = $("#claimSearch");

  if (search) {
    search.addEventListener("input", () => {
      const query = search.value.toLowerCase();

      const filtered = getRoleClaims().filter(claim =>
        [
          claim.id,
          claim.patient,
          claim.hospital,
          claim.treatment,
          claim.status
        ].join(" ").toLowerCase().includes(query)
      );

      const container = $("#claimsTableContainer");

      if (container) {
        container.innerHTML = claimTable(
          filtered,
          currentRole === "insurer"
        );
      }
    });
  }
}

/* LOGOUT */

function logout() {
  const app = $("#app");
  const login = $("#loginScreen");

  if (app) app.style.display = "none";
  if (login) login.style.display = "flex";

  currentRole = "patient";
  activePage = "dashboard";
}

/* INITIALIZATION */

document.addEventListener("DOMContentLoaded", () => {
  startLoader();

  document.querySelectorAll("[data-role]").forEach(button => {
    button.addEventListener("click", () => {
      document.querySelectorAll("[data-role]").forEach(item =>
        item.classList.remove("selected")
      );

      button.classList.add("selected");
    });
  });

  const loginButton = $("#loginBtn");

  if (loginButton) {
    loginButton.addEventListener("click", () => {
      const selected = document.querySelector(
        "[data-role].selected"
      );

      if (selected) loginUser(selected.dataset.role);
    });
  }

  const logoutButton = $("#logoutBtn");

  if (logoutButton) {
    logoutButton.addEventListener("click", logout);
  }

  const menuToggle = $("#menuToggle");

  if (menuToggle) {
    menuToggle.addEventListener("click", () => {
      $("#sidebar")?.classList.toggle("open");
    });
  }

  const sidebar = $("#sidebar");

  if (sidebar) {
    sidebar.addEventListener("click", event => {
      if (event.target.closest("[data-page]") &&
          window.innerWidth <= 760) {
        sidebar.classList.remove("open");
      }
    });
  }
});
