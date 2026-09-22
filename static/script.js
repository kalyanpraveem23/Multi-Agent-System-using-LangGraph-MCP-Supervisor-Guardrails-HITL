const API_BASE = "http://localhost:8000";

let currentThreadId = null;


/* =====================================================
   Example prompt
===================================================== */

function useExample(text) {

    document.getElementById("travelQuery").value = text;

}


/* =====================================================
   Start trip planning
===================================================== */

async function planTrip() {

    const input = document.getElementById("travelQuery");
    const button = document.getElementById("planBtn");

    const query = input.value.trim();

    if (!query) {

        alert("Please enter your travel request.");

        return;
    }


    // UI
    button.disabled = true;

    document.getElementById("emptyState")
        .classList.add("hidden");

    document.getElementById("results")
        .classList.add("hidden");

    document.getElementById("loading")
        .classList.remove("hidden");


    try {

        /*
         * Backend endpoint expected:
         *
         * POST /api/travel
         *
         * {
         *     "user_input": "Plan a trip to Delhi"
         * }
         */

        const response = await fetch(
            `${API_BASE}/api/travel`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({
                    user_input: query
                })
            }
        );


        if (!response.ok) {

            throw new Error(
                `Server error: ${response.status}`
            );

        }


        const data = await response.json();


        currentThreadId = data.thread_id;


        displayResults(data);


    } catch (error) {

        console.error(error);

        alert(
            "Unable to connect to TripMate backend.\n\n" +
            error.message
        );

    } finally {

        button.disabled = false;

        document.getElementById("loading")
            .classList.add("hidden");
    }
}


/* =====================================================
   Display backend response
===================================================== */

function displayResults(data) {

    document.getElementById("results")
        .classList.remove("hidden");


    // -----------------------------
    // Header
    // -----------------------------

    const constraints =
        data.trip_constraints || {};

    const destination =
        constraints.destination || "Travel Plan";

    document.getElementById("resultTitle")
        .textContent = destination;


    // -----------------------------
    // Agents
    // -----------------------------

    displayAgents(
        data.selected_agents || []
    );


    // -----------------------------
    // Constraints
    // -----------------------------

    displayConstraints(
        constraints
    );


    // -----------------------------
    // Agent results
    // -----------------------------

    document.getElementById("flightContent")
        .textContent =
        data.flight_results ||
        "Flight agent was not selected.";


    document.getElementById("hotelContent")
        .textContent =
        data.hotel_results ||
        "Hotel agent was not selected.";


    document.getElementById("weatherContent")
        .textContent =
        data.weather_results ||
        "Weather agent was not selected.";


    document.getElementById("budgetContent")
        .textContent =
        data.budget_results ||
        "Budget agent was not selected.";


    document.getElementById("itineraryContent")
        .textContent =
        data.itinerary ||
        "Itinerary is not available yet.";


    // -----------------------------
    // Supervisor
    // -----------------------------

    document.getElementById("reasoning")
        .textContent =
        data.supervisor_reasoning ||
        "No supervisor reasoning available.";


    // -----------------------------
    // Statistics
    // -----------------------------

    document.getElementById("threadId")
        .textContent =
        data.thread_id || "-";


    document.getElementById("llmCalls")
        .textContent =
        data.llm_calls ?? 0;


    // -----------------------------
    // Guardrail
    // -----------------------------

    if (data.guardrail_allowed === false) {

        showBlocked(data);

        return;
    }


    // -----------------------------
    // HITL
    // -----------------------------

    if (data.requires_approval) {

        showApproval(data);

    } else {

        showFinalResponse(data);
    }
}


/* =====================================================
   Display selected agents
===================================================== */

function displayAgents(agents) {

    const container =
        document.getElementById("agents");

    container.innerHTML = "";


    if (!agents.length) {

        container.innerHTML =
            `<span class="agent">
                No specialist agents selected
            </span>`;

        return;
    }


    agents.forEach(agent => {

        const element =
            document.createElement("span");

        element.className = "agent";

        element.textContent =
            formatAgentName(agent);

        container.appendChild(element);

    });
}


/* =====================================================
   Format agent name
===================================================== */

function formatAgentName(agent) {

    return agent
        .replace("_agent", "")
        .replaceAll("_", " ")
        .replace(/\b\w/g, char =>
            char.toUpperCase()
        );
}


/* =====================================================
   Display constraints
===================================================== */

function displayConstraints(constraints) {

    const container =
        document.getElementById("constraints");

    container.innerHTML = "";


    const fields = {

        destination: "Destination",

        origin: "Origin",

        duration: "Duration",

        budget: "Budget",

        travel_style: "Travel Style",

        special_preferences: "Preferences"

    };


    Object.entries(fields).forEach(
        ([key, label]) => {

            let value =
                constraints[key];


            if (
                Array.isArray(value)
            ) {

                value =
                    value.length
                        ? value.join(", ")
                        : "None";

            }


            if (!value) {

                value = "Not specified";

            }


            const item =
                document.createElement("div");

            item.className =
                "constraint";


            item.innerHTML = `
                <span>${label}</span>
                <strong>${escapeHtml(String(value))}</strong>
            `;


            container.appendChild(item);

        }
    );
}


/* =====================================================
   Human approval
===================================================== */

function showApproval(data) {

    const approvalBox =
        document.getElementById("approvalBox");

    approvalBox.classList.remove("hidden");


    document.getElementById("approvalRequest")
        .textContent =
        data.approval_request ||
        "Please review the itinerary.";


    document.getElementById("approvalStatus")
        .textContent =
        "Waiting for Approval";


    document.getElementById("systemStatus")
        .textContent =
        "Waiting for human review";


    document.getElementById("finalBox")
        .classList.add("hidden");
}


/* =====================================================
   Submit human approval
===================================================== */

async function submitApproval(approved) {

    if (!currentThreadId) {

        alert("Thread ID is missing.");

        return;
    }


    const feedback =
        document.getElementById("feedback")
            .value
            .trim();


    try {

        /*
         * Backend endpoint expected:
         *
         * POST /api/approve
         *
         * {
         *     "thread_id": "...",
         *     "approved": true,
         *     "feedback": "..."
         * }
         */


        const response = await fetch(
            `${API_BASE}/api/approve`,
            {
                method: "POST",

                headers: {
                    "Content-Type": "application/json"
                },

                body: JSON.stringify({

                    thread_id:
                        currentThreadId,

                    approved:
                        approved,

                    feedback:
                        feedback

                })
            }
        );


        if (!response.ok) {

            throw new Error(
                `Approval failed: ${response.status}`
            );
        }


        const data =
            await response.json();


        // Hide approval UI

        document.getElementById("approvalBox")
            .classList.add("hidden");


        // Update results

        displayResults(data);


    } catch (error) {

        console.error(error);

        alert(
            "Unable to submit approval.\n\n" +
            error.message
        );
    }
}


/* =====================================================
   Final response
===================================================== */

function showFinalResponse(data) {

    document.getElementById("approvalBox")
        .classList.add("hidden");


    document.getElementById("finalBox")
        .classList.remove("hidden");


    document.getElementById("finalResponse")
        .textContent =
        data.answer ||
        data.final_response ||
        "Travel plan completed.";


    document.getElementById("approvalStatus")
        .textContent =
        data.approved
            ? "Approved"
            : "Completed";


    document.getElementById("systemStatus")
        .textContent =
        "Completed";
}


/* =====================================================
   Guardrail blocked
===================================================== */

function showBlocked(data) {

    document.getElementById("approvalBox")
        .classList.add("hidden");


    document.getElementById("finalBox")
        .classList.remove("hidden");


    document.getElementById("finalResponse")
        .textContent =
        data.guardrail_reason ||
        data.answer ||
        "This request was blocked.";


    document.getElementById("approvalStatus")
        .textContent =
        "Blocked";


    document.getElementById("systemStatus")
        .textContent =
        "Guardrail blocked";
}


/* =====================================================
   Toggle result sections
===================================================== */

function toggleSection(id) {

    const element =
        document.getElementById(id);


    if (
        element.style.display === "none"
    ) {

        element.style.display = "block";

    } else {

        element.style.display = "none";

    }
}


/* =====================================================
   Basic HTML escaping
===================================================== */

function escapeHtml(value) {

    return value
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}