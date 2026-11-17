
const $ = (id) => document.getElementById(id);

const STORAGE_KEY = "dancedesk_slots_v1";

const DEFAULT_CHOREOGRAPHERS = [
    "Shreya", "Dev", "Nisha", "Dhwani", "Isha"
];

let slots = loadSlots();

// DATA AND STORAGE
function normalizeChoreographers(value) {
    if (Array.isArray(value)) {
        return value.map(x => String(x).trim()).filter(Boolean);
    }

    return String(value || "")
        .split(",")
        .map(x => x.trim())
        .filter(Boolean);
}

function loadSlots() {
    try {
        const saved = JSON.parse(
            localStorage.getItem(STORAGE_KEY) || "[]"
        );

        return saved.map(s => ({
            ...s,
            choreographers: normalizeChoreographers(s.choreographers),
            status: s.status === "Completed" ? "Completed" : "Pending"
        }));
    } catch {
        return [];
    }
}

function saveSlots() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(slots));
}

// DATE FUNCTIONS
function localDateString(date = new Date()) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");

    return `${y}-${m}-${d}`;
}

function prettyDate(value) {
    if (!value) return "";

    return new Date(value + "T12:00:00").toLocaleDateString(
        "en-IN",
        {
            weekday: "long",
            day: "numeric",
            month: "long",
            year: "numeric"
        }
    );
}

function formatTime(value) {
    if (!value) return "";

    const [h, m] = value.split(":").map(Number);

    return new Date(2000, 0, 1, h, m).toLocaleTimeString(
        "en-IN",
        {
            hour: "numeric",
            minute: "2-digit"
        }
    );
}

function escapeHtml(value = "") {
    return String(value).replace(/[&<>"']/g, c => ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;"
    })[c]);
}

// CHOREOGRAPHER HELPERS
function getChoreographers(slot) {
    return normalizeChoreographers(slot.choreographers);
}

function allChoreographers() {
    const names = new Set(DEFAULT_CHOREOGRAPHERS);

    slots.forEach(slot => {
        getChoreographers(slot).forEach(name => names.add(name));
    });

    return [...names].sort((a, b) => a.localeCompare(b));
}

// GET SELECTED DATE'S SCHEDULE
function selectedDaySlots() {
    const day = $("selectedDate").value;
    const query = $("searchInput").value.trim().toLowerCase();

    return slots
        .filter(s => s.date === day)
        .filter(s =>
            !query ||
            [
                s.client,
                s.activity,
                getChoreographers(s).join(" "),
                s.venue,
                s.taskDetails,
                s.notes,
                s.status
            ].join(" ").toLowerCase().includes(query)
        )
        .sort((a, b) =>
            (a.startTime || "").localeCompare(b.startTime || "")
        );
}

// SESSION TRACKER
function completedSlots() {
    return slots.filter(s => s.status === "Completed");
}

function renderTracker() {
    const completed = completedSlots();

    const totalIndividualSessions = completed.reduce(
        (total, slot) => total + getChoreographers(slot).length,
        0
    );

    $("totalCompletedCount").textContent = totalIndividualSessions;
    $("completedSlotCount").textContent = completed.length;

    const thisMonth = localDateString().slice(0, 7);

    $("choreographerTracker").innerHTML = allChoreographers().map(name => {
        const personSessions = completed.filter(slot =>
            getChoreographers(slot).some(
                person => person.toLowerCase() === name.toLowerCase()
            )
        );

        const monthlyCount = personSessions.filter(slot =>
            (slot.date || "").startsWith(thisMonth)
        ).length;

        return `
            <div class="tracker-person">
                <div>
                    <strong>${escapeHtml(name)}</strong><br>
                    <span>${monthlyCount} this month</span>
                </div>
                <div>
                    <strong>${personSessions.length}</strong>
                    <span> total sessions</span>
                </div>
            </div>
        `;
    }).join("");

    if (!allChoreographers().length) {
        $("choreographerTracker").innerHTML =
            `<p class="field-hint">No choreographers added yet.</p>`;
    }

    renderPersonHistory();
}

function renderPersonHistory() {
    const selectedPerson = $("trackerPerson").value;

    const history = completedSlots()
        .filter(slot => getChoreographers(slot).some(
            name => name.toLowerCase() === selectedPerson.toLowerCase()
        ))
        .sort((a, b) => {
            const dateCompare = (b.date || "").localeCompare(a.date || "");

            return dateCompare ||
                (b.startTime || "").localeCompare(a.startTime || "");
        });

    if (!history.length) {
        $("trackerHistory").innerHTML =
            `<p class="field-hint">No completed sessions recorded for ${escapeHtml(selectedPerson)} yet.</p>`;
        return;
    }

    $("trackerHistory").innerHTML = history.map(slot => `
        <div class="tracker-person">
            <div>
                <strong>${escapeHtml(slot.client || "Unnamed client")}</strong><br>
                <span>${escapeHtml(prettyDate(slot.date))}</span>
            </div>
            <div>
                <span>${escapeHtml(slot.activity || "Rehearsal")}</span><br>
                <span>${escapeHtml(formatTime(slot.startTime))}</span>
            </div>
        </div>
    `).join("");
}

// DISPLAY SCHEDULE
function render() {
    const day = $("selectedDate").value;

    $("todayLabel").textContent =
        new Date().toLocaleDateString("en-IN", {
            day: "numeric",
            month: "short",
            year: "numeric"
        });

    $("scheduleHeading").textContent = prettyDate(day);

    const daySlots = selectedDaySlots();

    $("slotCount").textContent = daySlots.length;

    $("clientCount").textContent =
        new Set(
            daySlots.map(s => (s.client || "").trim().toLowerCase())
        ).size;

    $("choreoCount").textContent =
        new Set(
            daySlots.flatMap(s =>
                getChoreographers(s).map(x => x.toLowerCase())
            )
        ).size;

    if (!daySlots.length) {
        $("scheduleList").innerHTML = `
            <div class="empty">
                No rehearsals added for this date yet.
                <br><br>
                Click Add Rehearsal to create your schedule.
            </div>
        `;
    } else {
        $("scheduleList").innerHTML = daySlots.map(s => `
            <article class="slot-card">
                <div class="slot-time">
                    ${escapeHtml(formatTime(s.startTime))}
                    ${s.endTime
                        ? " – " + escapeHtml(formatTime(s.endTime))
                        : " onwards"}
                    <small>${escapeHtml(s.activity || "Rehearsal")}</small>
                </div>

                <div class="slot-main">
                    <h3>${escapeHtml(s.client)}</h3>

                    ${getChoreographers(s).length
                        ? `<p>Choreographers: ${escapeHtml(getChoreographers(s).join(", "))}</p>`
                        : ""}

                    ${s.venue
                        ? `<p>Venue: ${escapeHtml(s.venue)}</p>`
                        : ""}

                    ${s.taskDetails
                        ? `<p>Tasks: ${escapeHtml(s.taskDetails).replace(/\n/g, "<br>")}</p>`
                        : ""}

                    ${s.notes
                        ? `<p>Notes: ${escapeHtml(s.notes)}</p>`
                        : ""}

                    <span class="status-badge ${s.status === "Completed" ? "completed" : "pending"}">
                        ${escapeHtml(s.status)}
                    </span>
                </div>

                <div class="slot-actions">
                    <button class="icon-btn" data-edit="${escapeHtml(s.id)}">Edit</button>
                    <button class="icon-btn" data-delete="${escapeHtml(s.id)}">Delete</button>
                </div>
            </article>
        `).join("");

        document.querySelectorAll("[data-edit]").forEach(button => {
            button.addEventListener("click", () => {
                openEdit(button.dataset.edit);
            });
        });

        document.querySelectorAll("[data-delete]").forEach(button => {
            button.addEventListener("click", () => {
                deleteSlot(button.dataset.delete);
            });
        });
    }

    renderTracker();
}

// RESET FORM
function resetForm() {
    $("slotForm").reset();
    $("slotId").value = "";
    $("status").value = "Pending";

    document.querySelectorAll('input[name="choreographer"]').forEach(box => {
        box.checked = false;
    });
}

// ADD NEW REHEARSAL
function openNew() {
    resetForm();

    $("dialogTitle").textContent = "Add rehearsal";
    $("slotDate").value = $("selectedDate").value;

    $("slotDialog").showModal();
}

// EDIT REHEARSAL
function openEdit(id) {
    const s = slots.find(x => x.id === id);

    if (!s) return;

    resetForm();

    $("slotId").value = s.id;
    $("slotDate").value = s.date;
    $("client").value = s.client || "";
    $("startTime").value = s.startTime || "";
    $("endTime").value = s.endTime || "";

    const activitySelect = $("activity");
    const activityValue = s.activity || "";

    if (activityValue && ![...activitySelect.options].some(
        option => option.value === activityValue
    )) {
        const option = document.createElement("option");
        option.value = activityValue;
        option.textContent = activityValue;
        activitySelect.appendChild(option);
    }

    activitySelect.value = activityValue;

    const names = getChoreographers(s);

    document.querySelectorAll('input[name="choreographer"]').forEach(box => {
        box.checked = names.some(
            name => name.toLowerCase() === box.value.toLowerCase()
        );
    });

    $("venue").value = s.venue || "";
    $("taskDetails").value = s.taskDetails || "";
    $("notes").value = s.notes || "";
    $("status").value = s.status || "Pending";

    $("dialogTitle").textContent = "Edit rehearsal";
    $("slotDialog").showModal();
}

// DELETE REHEARSAL
function deleteSlot(id) {
    if (!confirm("Delete this rehearsal slot?")) return;

    slots = slots.filter(s => s.id !== id);

    saveSlots();
    render();
}

// SAVE REHEARSAL
$("slotForm").addEventListener("submit", function(event) {
    event.preventDefault();

    const id = $("slotId").value ||
        (crypto.randomUUID
            ? crypto.randomUUID()
            : String(Date.now()));

    const selectedChoreographers = [
        ...document.querySelectorAll('input[name="choreographer"]:checked')
    ].map(box => box.value);

    const record = {
        id,
        date: $("slotDate").value,
        client: $("client").value.trim(),
        startTime: $("startTime").value,
        endTime: $("endTime").value,
        activity: $("activity").value,
        choreographers: selectedChoreographers,
        venue: $("venue").value.trim(),
        taskDetails: $("taskDetails").value.trim(),
        notes: $("notes").value.trim(),
        status: $("status").value
    };

    const index = slots.findIndex(s => s.id === id);

    if (index >= 0) {
        slots[index] = record;
    } else {
        slots.push(record);
    }

    saveSlots();

    $("selectedDate").value = record.date;
    $("slotDialog").close();

    render();
});

// GENERATE WHATSAPP MESSAGE
function generateMessage() {
    const daySlots = slots
        .filter(s => s.date === $("selectedDate").value)
        .sort((a, b) =>
            (a.startTime || "").localeCompare(b.startTime || "")
        );

    if (!daySlots.length) {
        $("messageOutput").value =
            "No rehearsals added for this date yet.";
        return;
    }

    const greeting = $("greeting").value.trim();
    const lines = [];

    if (greeting) {
        lines.push(greeting, "");
    }

    lines.push(
        `Date: ${prettyDate($("selectedDate").value)}`,
        ""
    );

    daySlots.forEach((s, index) => {
        let session = `${index + 1}. ${formatTime(s.startTime)}`;

        if (s.endTime) {
            session += ` – ${formatTime(s.endTime)}`;
        } else {
            session += " Onwards";
        }

        if (s.venue) {
            session += ` | ${s.venue}`;
        }

        lines.push(session);

        const names = getChoreographers(s).join(" and ");
        let description = "";

        if (names) description += names;

        if (s.activity) {
            if (description) description += " ";
            description += s.activity;
        }

        if (description) lines.push(description);

        if (s.taskDetails && s.taskDetails.trim()) {
            const tasks = s.taskDetails
                .split("\n")
                .map(task => task.trim())
                .filter(Boolean);

            tasks.forEach(task => lines.push(`- ${task}`));
        }

        if (s.notes) {
            lines.push(`Note: ${s.notes}`);
        }

        lines.push("");
    });

    const reminder = $("reminder").value.trim();

    if (reminder) lines.push(reminder);

    $("messageOutput").value = lines.join("\n").trim();
}

// COPY WHATSAPP MESSAGE
$("copyBtn").addEventListener("click", async function() {
    const text = $("messageOutput").value;

    if (!text) {
        $("copyStatus").textContent = "Generate a message first.";
        return;
    }

    try {
        await navigator.clipboard.writeText(text);
        $("copyStatus").textContent =
            "Copied! Ready to paste into WhatsApp.";
    } catch {
        $("messageOutput").select();

        document.execCommand("copy");

        $("copyStatus").textContent = "Copied!";
    }
});

// CLEAR ALL SLOTS FOR SELECTED DATE
$("clearDayBtn").addEventListener("click", function() {
    const day = $("selectedDate").value;
    const count = slots.filter(s => s.date === day).length;

    if (!count) {
        alert("There are no slots to clear for this date.");
        return;
    }

    if (confirm(
        `Delete all ${count} rehearsal slot(s) on ${prettyDate(day)}?`
    )) {
        slots = slots.filter(s => s.date !== day);
        saveSlots();
        render();
    }
});

// BUTTONS AND INPUTS
$("newSlotBtn").addEventListener("click", openNew);

$("closeDialog").addEventListener("click", () => {
    $("slotDialog").close();
});

$("cancelDialog").addEventListener("click", () => {
    $("slotDialog").close();
});

$("selectedDate").addEventListener("change", render);
$("searchInput").addEventListener("input", render);

$("todayBtn").addEventListener("click", () => {
    $("selectedDate").value = localDateString();
    render();
});

$("generateBtn").addEventListener("click", generateMessage);

$("trackerPerson").addEventListener("change", renderPersonHistory);

// INITIALIZE DASHBOARD
$("selectedDate").value = localDateString();

render();
