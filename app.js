const $ = (id) => document.getElementById(id);
const STORAGE_KEY = "dancedesk_slots_v1";
let slots = loadSlots();

function loadSlots() {
  try { return JSON.parse(localStorage.getItem(STORAGE_KEY) || "[]"); }
  catch { return []; }
}
function saveSlots() { localStorage.setItem(STORAGE_KEY, JSON.stringify(slots)); }
function localDateString(date = new Date()) {
  const y = date.getFullYear(), m = String(date.getMonth()+1).padStart(2,"0"), d = String(date.getDate()).padStart(2,"0");
  return `${y}-${m}-${d}`;
}
function prettyDate(value) {
  if (!value) return "";
  return new Date(value + "T12:00:00").toLocaleDateString("en-IN",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
}
function formatTime(value) {
  if (!value) return "";
  const [h,m] = value.split(":").map(Number);
  return new Date(2000,0,1,h,m).toLocaleTimeString("en-IN",{hour:"numeric",minute:"2-digit"});
}
function escapeHtml(value="") {
  return String(value).replace(/[&<>"']/g, c => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
}
function selectedDaySlots() {
  const day = $("selectedDate").value;
  const query = $("searchInput").value.trim().toLowerCase();
  return slots.filter(s => s.date === day)
    .filter(s => !query || [s.client,s.activity,s.choreographers,s.venue,s.notes].join(" ").toLowerCase().includes(query))
    .sort((a,b) => (a.startTime || "").localeCompare(b.startTime || ""));
}
function render() {
  const day = $("selectedDate").value;
  $("todayLabel").textContent = new Date().toLocaleDateString("en-IN",{day:"numeric",month:"short",year:"numeric"});
  $("scheduleHeading").textContent = prettyDate(day);
  const daySlots = selectedDaySlots();
  $("slotCount").textContent = daySlots.length;
  $("clientCount").textContent = new Set(daySlots.map(s=>s.client.trim().toLowerCase())).size;
  $("choreoCount").textContent = new Set(daySlots.flatMap(s=>(s.choreographers||"").split(",").map(x=>x.trim().toLowerCase()).filter(Boolean))).size;
  if (!daySlots.length) {
    $("scheduleList").innerHTML = `<div class="empty">No rehearsals added for this date yet.<br><br>Tap <b>＋ Add rehearsal</b> to create the day's schedule.</div>`;
    return;
  }
  $("scheduleList").innerHTML = daySlots.map(s => `
    <article class="slot-card">
      <div class="slot-time">${escapeHtml(formatTime(s.startTime))}${s.endTime ? " – "+escapeHtml(formatTime(s.endTime)) : " onwards"}<small>${escapeHtml(s.activity || "Rehearsal")}</small></div>
      <div class="slot-main"><h3>${escapeHtml(s.client)}</h3>
        ${s.choreographers ? `<p>🎭 ${escapeHtml(s.choreographers)}</p>` : ""}
        ${s.venue ? `<p>📍 ${escapeHtml(s.venue)}</p>` : ""}
        ${s.notes ? `<p>✦ ${escapeHtml(s.notes)}</p>` : ""}
      </div>
      <div class="slot-actions"><button class="icon-btn" data-edit="${s.id}" aria-label="Edit">Edit</button><button class="icon-btn" data-delete="${s.id}" aria-label="Delete">×</button></div>
    </article>`).join("");
  document.querySelectorAll("[data-edit]").forEach(b=>b.addEventListener("click",()=>openEdit(b.dataset.edit)));
  document.querySelectorAll("[data-delete]").forEach(b=>b.addEventListener("click",()=>deleteSlot(b.dataset.delete)));
}
function openNew() {
  $("slotForm").reset(); $("slotId").value=""; $("dialogTitle").textContent="Add rehearsal";
  $("slotDate").value=$("selectedDate").value; $("slotDialog").showModal();
}
function openEdit(id) {
  const s=slots.find(x=>x.id===id); if(!s) return;
  $("slotId").value=s.id; $("slotDate").value=s.date; $("client").value=s.client;
  $("startTime").value=s.startTime; $("endTime").value=s.endTime||"";
  $("activity").value=s.activity||""; $("choreographers").value=s.choreographers||"";
  $("venue").value=s.venue||""; $("notes").value=s.notes||"";
  $("dialogTitle").textContent="Edit rehearsal"; $("slotDialog").showModal();
}
function deleteSlot(id) {
  if(!confirm("Delete this rehearsal slot?")) return;
  slots=slots.filter(s=>s.id!==id); saveSlots(); render();
}
$("slotForm").addEventListener("submit",e=>{
  e.preventDefault();
  const id=$("slotId").value || (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()));
  const record={id,date:$("slotDate").value,client:$("client").value.trim(),startTime:$("startTime").value,endTime:$("endTime").value,activity:$("activity").value.trim(),choreographers:$("choreographers").value.trim(),venue:$("venue").value.trim(),notes:$("notes").value.trim()};
  const index=slots.findIndex(s=>s.id===id);
  if(index>=0) slots[index]=record; else slots.push(record);
  saveSlots(); $("selectedDate").value=record.date; $("slotDialog").close(); render();
});
function generateMessage() {
  const daySlots=slots.filter(s=>s.date===$("selectedDate").value).sort((a,b)=>(a.startTime||"").localeCompare(b.startTime||""));
  if(!daySlots.length){$("messageOutput").value="No rehearsals added for this date yet.";return;}
  const greeting=$("greeting").value.trim();
  const lines=[];
  if(greeting) lines.push(greeting,"");
  lines.push(`Here's the rehearsal schedule for ${prettyDate($("selectedDate").value)}:`, "", "📅 REHEARSAL SCHEDULE", "");
  daySlots.forEach(s=>{
    const time=`${formatTime(s.startTime)}${s.endTime?" – "+formatTime(s.endTime):" onwards"}`;
    lines.push(`🕒 ${time}`,`👥 ${s.client}`);
    if(s.activity) lines.push(`✨ ${s.activity}`);
    if(s.choreographers) lines.push(`🎭 Choreographer(s): ${s.choreographers}`);
    if(s.venue) lines.push(`📍 Venue: ${s.venue}`);
    if(s.notes) lines.push(`Note: ${s.notes}`);
    lines.push("");
  });
  const reminder=$("reminder").value.trim();
  if(reminder) lines.push(reminder);
  lines.push("Thank you! ❤️");
  $("messageOutput").value=lines.join("\n").trim();
}
$("newSlotBtn").addEventListener("click",openNew);
$("closeDialog").addEventListener("click",()=>$("slotDialog").close());
$("cancelDialog").addEventListener("click",()=>$("slotDialog").close());
$("selectedDate").addEventListener("change",render);
$("searchInput").addEventListener("input",render);
$("todayBtn").addEventListener("click",()=>{$("selectedDate").value=localDateString();render();});
$("generateBtn").addEventListener("click",generateMessage);
$("copyBtn").addEventListener("click",async()=>{
  const text=$("messageOutput").value;
  if(!text){$("copyStatus").textContent="Generate a message first.";return;}
  try{await navigator.clipboard.writeText(text);$("copyStatus").textContent="Copied! Ready to paste into WhatsApp.";}
  catch{$("messageOutput").select();document.execCommand("copy");$("copyStatus").textContent="Copied!";}
});
$("clearDayBtn").addEventListener("click",()=>{
  const day=$("selectedDate").value, count=slots.filter(s=>s.date===day).length;
  if(!count){alert("There are no slots to clear for this date.");return;}
  if(confirm(`Delete all ${count} rehearsal slot(s) on ${prettyDate(day)}?`)){slots=slots.filter(s=>s.date!==day);saveSlots();render();}
});
$("selectedDate").value=localDateString();
render();

// Export and import are available from the browser console:
// exportDanceDesk() downloads a JSON backup.
// importDanceDesk(jsonFile) is intentionally not automatic; use the Import button added in a future version.
window.exportDanceDesk = function(){
  const blob=new Blob([JSON.stringify(slots,null,2)],{type:"application/json"});
  const url=URL.createObjectURL(blob),a=document.createElement("a");
  a.href=url;a.download=`dancedesk-backup-${localDateString()}.json`;a.click();URL.revokeObjectURL(url);
};
