
// ======================================
// HEALTHGUARD - MAIN JAVASCRIPT
// ======================================

// Store claims in browser storage
let claims = JSON.parse(localStorage.getItem("healthguardClaims")) || [];

let currentRole = null;
let permissionEnabled =
    localStorage.getItem("healthguardPermission") === "true";


// Save claims
function saveClaims() {
    localStorage.setItem("healthguardClaims", JSON.stringify(claims));
}


// Scroll to portals
function scrollToPortals() {
    document.getElementById("portals").scrollIntoView({
        behavior: "smooth"
    });
}


// About section
function showAbout() {
    document.getElementById("about").scrollIntoView({
        behavior: "smooth"
    });
}


// ======================================
// PORTAL NAVIGATION
// ======================================

function openPortal(role) {

    currentRole = role;

    document.getElementById("dashboard").style.display = "block";

    document.getElementById("dashboardTitle").textContent =
        role.charAt(0).toUpperCase() + role.slice(1) + " Dashboard";

    document.getElementById("dashboardSubtitle").textContent =
        "Welcome to HealthGuard " + role + " portal.";

    // Hide all dashboards
    document.getElementById("patientDashboard").style.display = "none";
    document.getElementById("hospitalDashboard").style.display = "none";
    document.getElementById("insurerDashboard").style.display = "none";

    // Display selected dashboard
    if (role === "patient") {
        document.getElementById("patientDashboard").style.display = "block";
        updatePatientDashboard();
    }

    else if (role === "hospital") {
        document.getElementById("hospitalDashboard").style.display = "block";
        updateHospitalDashboard();
    }

    else if (role === "insurer") {
        document.getElementById("insurerDashboard").style.display = "block";
        updateInsurerDashboard();
    }

    document.getElementById("dashboard").scrollIntoView({
        behavior: "smooth"
    });
}


// Logout
function logout() {

    currentRole = null;

    document.getElementById("dashboard").style.display = "none";

    scrollToPortals();
}


// ======================================
// PATIENT PERMISSIONS
// ======================================

function togglePermission(enabled) {

    permissionEnabled = enabled;

    localStorage.setItem(
        "healthguardPermission",
        enabled
    );

    const status = document.getElementById("permissionStatus");

    status.textContent = enabled
        ? "Hospital access permission is enabled."
        : "Hospital access permission is disabled.";
}


// ======================================
// CREATE INSURANCE CLAIM
// ======================================

const claimForm = document.getElementById("claimForm");

claimForm.addEventListener("submit", function(event) {

    event.preventDefault();

    if (!permissionEnabled) {
        alert("Patient permission is disabled. Enable hospital access from the Patient Portal first.");
        return;
    }

    const patientName =
        document.getElementById("patientName").value.trim();

    const policyId =
        document.getElementById("policyId").value.trim();

    const treatment =
        document.getElementById("treatment").value.trim();

    const amount =
        Number(document.getElementById("claimAmount").value);

    if (!patientName || !policyId || !treatment || amount <= 0) {
        alert("Please enter valid claim details.");
        return;
    }

    const claim = {

        id: "HG" + Date.now().toString().slice(-8),

        patient: patientName,

        policy: policyId,

        treatment: treatment,

        amount: amount,

        status: "Pending",

        proofStatus: "Not Verified",

        transactionId: null,

        date: new Date().toLocaleDateString()

    };

    claims.push(claim);

    saveClaims();

    claimForm.reset();

    alert("Insurance claim submitted successfully!");

    updateHospitalDashboard();

});


// ======================================
// PATIENT DASHBOARD
// ======================================

function updatePatientDashboard() {

    const patientClaims = claims;

    document.getElementById("patientClaimCount").textContent =
        patientClaims.length;

    document.getElementById("patientApprovedCount").textContent =
        patientClaims.filter(c => c.status === "Approved").length;

    const container = document.getElementById("patientClaims");

    if (patientClaims.length === 0) {

        container.innerHTML = "<p>No insurance claims found.</p>";

        return;
    }

    container.innerHTML = patientClaims.map(claim => `

        <div class="claim-item">

            <div>
                <h4>${escapeHTML(claim.treatment)}</h4>

                <p>Claim ID: ${claim.id}</p>

                <p>Amount: ₹${claim.amount.toLocaleString("en-IN")}</p>

                <p>Date: ${claim.date}</p>
            </div>

            <span class="claim-status ${claim.status.toLowerCase()}">
                ${claim.status}
            </span>

        </div>

    `).join("");

    document.getElementById("permissionToggle").checked =
        permissionEnabled;

    document.getElementById("permissionStatus").textContent =
        permissionEnabled
        ? "Hospital access permission is enabled."
        : "Hospital access permission is disabled.";
}


// ======================================
// HOSPITAL DASHBOARD
// ======================================

function updateHospitalDashboard() {

    document.getElementById("hospitalClaimCount").textContent =
        claims.length;

    document.getElementById("hospitalPendingCount").textContent =
        claims.filter(c => c.status === "Pending").length;

    const container = document.getElementById("hospitalClaims");

    if (claims.length === 0) {

        container.innerHTML = "<p>No claims created yet.</p>";

        return;
    }

    container.innerHTML = claims.map(claim => `

        <div class="claim-item">

            <div>
                <h4>${escapeHTML(claim.patient)}</h4>

                <p>${escapeHTML(claim.treatment)}</p>

                <p>Claim ID: ${claim.id}</p>

                <p>Amount: ₹${claim.amount.toLocaleString("en-IN")}</p>
            </div>

            <span class="claim-status ${claim.status.toLowerCase()}">
                ${claim.status}
            </span>

        </div>

    `).join("");

}


// ======================================
// INSURER DASHBOARD
// ======================================

function updateInsurerDashboard() {

    document.getElementById("insurerTotal").textContent =
        claims.length;

    document.getElementById("insurerPending").textContent =
        claims.filter(c => c.status === "Pending").length;

    document.getElementById("insurerApproved").textContent =
        claims.filter(c => c.status === "Approved").length;

    const container = document.getElementById("insurerClaims");

    if (claims.length === 0) {

        container.innerHTML = "<p>No insurance claims available.</p>";

        return;
    }

    container.innerHTML = claims.map(claim => `

        <div class="claim-item">

            <div>
                <h4>${escapeHTML(claim.patient)}</h4>

                <p>Claim ID: ${claim.id}</p>

                <p>Policy: ${escapeHTML(claim.policy)}</p>

                <p>Treatment: ${escapeHTML(claim.treatment)}</p>

                <p>Amount: ₹${claim.amount.toLocaleString("en-IN")}</p>

                <p>Proof: ${claim.proofStatus}</p>
            </div>

            <div class="claim-actions">

                <span class="claim-status ${claim.status.toLowerCase()}">
                    ${claim.status}
                </span>

                ${
                    claim.status === "Pending"
                    ? `
                        <button onclick="verifyClaim('${claim.id}')">
                            Verify ZKP
                        </button>
                    `
                    : ""
                }

                ${
                    claim.status === "Verified"
                    ? `
                        <button class="approve"
                            onclick="approveClaim('${claim.id}')">
                            Approve
                        </button>

                        <button class="reject"
                            onclick="rejectClaim('${claim.id}')">
                            Reject
                        </button>
                    `
                    : ""
                }

            </div>

        </div>

    `).join("");

}


// ======================================
// ZKP VERIFICATION SIMULATION
// ======================================

function verifyClaim(id) {

    const claim = claims.find(c => c.id === id);

    if (!claim) return;

    const modal = document.getElementById("verificationModal");

    const message = document.getElementById("verificationMessage");

    const result = document.getElementById("verificationResult");

    modal.style.display = "flex";

    message.textContent = "Running simulated proof verification...";

    result.innerHTML = `
        <p>Checking claim identifier...</p>
        <p>Checking policy information...</p>
        <p>Checking proof verification result...</p>
    `;

    setTimeout(() => {

        // Demonstration only, not real cryptographic verification
        const proofValid =
            Boolean(claim.policy && claim.amount > 0 && claim.treatment);

        if (proofValid) {

            claim.proofStatus = "Simulated Verification Passed";

            claim.status = "Verified";

            claim.transactionId =
                "DEMO-" + Date.now().toString(16).toUpperCase();

            saveClaims();

            message.textContent = "Demo verification successful!";

            result.innerHTML = `
                <p style="color:green;">
                    <i class="fa-solid fa-circle-check"></i>
                    Proof simulation passed
                </p>

                <p>Claim ID: ${claim.id}</p>

                <p>Demo Transaction: ${claim.transactionId}</p>

                <p>Medical records were not displayed in this demo.</p>
            `;

        }

        else {

            message.textContent = "Verification failed.";

            result.innerHTML = `
                <p style="color:red;">Invalid claim information.</p>
            `;

        }

        updateInsurerDashboard();

    }, 1800);

}


// ======================================
// APPROVE CLAIM
// ======================================

function approveClaim(id) {

    const claim = claims.find(c => c.id === id);

    if (!claim || claim.status !== "Verified") return;

    const confirmApproval = confirm(
        "Are you sure you want to approve this claim?"
    );

    if (!confirmApproval) return;

    claim.status = "Approved";

    saveClaims();

    alert("Claim approved successfully!");

    updateInsurerDashboard();

}


// ======================================
// REJECT CLAIM
// ======================================

function rejectClaim(id) {

    const claim = claims.find(c => c.id === id);

    if (!claim || claim.status !== "Verified") return;

    const confirmRejection = confirm(
        "Are you sure you want to reject this claim?"
    );

    if (!confirmRejection) return;

    claim.status = "Rejected";

    saveClaims();

    alert("Claim rejected.");

    updateInsurerDashboard();

}


// ======================================
// CLOSE VERIFICATION MODAL
// ======================================

function closeModal() {

    document.getElementById("verificationModal").style.display = "none";

}


// ======================================
// BASIC HTML ESCAPING
// ======================================

function escapeHTML(value) {

    return String(value).replace(/[&<>"']/g, character => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[character]);

}


// ======================================
// INITIALIZATION
// ======================================

document.getElementById("permissionToggle").checked =
    permissionEnabled;

document.getElementById("permissionStatus").textContent =
    permissionEnabled
    ? "Hospital access permission is enabled."
    : "Hospital access permission is disabled.";
