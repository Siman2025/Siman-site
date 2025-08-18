
(function(){
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const fmtDate = (d) => d.toISOString().slice(0,10);
const pad = (n)=> String(n).padStart(2,'0');
const toSlot = (d,h)=> `${fmtDate(d)}T${pad(h)}:00`;
const today = new Date(); today.setHours(0,0,0,0);

// Admin password gate
const ADMIN_PASSWORD = "Siman!2025"; // change if you like
let ADMIN_ON = false;
try { ADMIN_ON = sessionStorage.getItem("siman_admin_on") === "1"; } catch {}
function requireAdmin() {
  if (ADMIN_ON) return true;
  const entered = prompt("Enter admin password:");
  if (entered === ADMIN_PASSWORD) {
    ADMIN_ON = true;
    try { sessionStorage.setItem("siman_admin_on", "1"); } catch {}
    return true;
  }
  alert("Incorrect password.");
  return false;
}

// Services (for dropdown)
const SERVICES = [
  {name:"Aromatherapy Massage", minutes:60, price:130},
  {name:"Relaxing Oil Massage", minutes:60, price:120},
  {name:"Relaxing Oil Massage", minutes:30, price:75},
  {name:"Prenatal Massage", minutes:60, price:120},
  {name:"Prenatal Massage", minutes:30, price:75},
  {name:"Postnatal Massage", minutes:60, price:120},
  {name:"Postnatal Massage", minutes:30, price:75},
  {name:"Swedish Massage", minutes:60, price:120},
  {name:"Remedial Massage", minutes:60, price:120},
  {name:"Remedial Massage", minutes:30, price:70},
  {name:"Hot Stone Massage", minutes:60, price:120},
  {name:"Indian Head Massage", minutes:30, price:45},
  {name:"Head & Shoulder Massage", minutes:30, price:65},
  {name:"Foot Reflexology Massage", minutes:30, price:65},
];

// State
const STORAGE_KEY='siman_availability_v2';
function load(){ try{ return JSON.parse(localStorage.getItem(STORAGE_KEY)) || null }catch{return null} }
function save(state){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }
function buildInitial(){
  const availability = {};
  for(let i=0;i<21;i++){
    const d=new Date(today); d.setDate(d.getDate()+i);
    const hours = i<7 ? [...Array(9)].map((_,k)=>9+k) : [];
    availability[fmtDate(d)]=hours.map(h=>toSlot(d,h));
  }
  return {availability, bookings:[]};
}
let state = load() || buildInitial();
save(state);

// Populate service dropdown
const sel = document.getElementById('service');
if (sel) {
  SERVICES.forEach(s=>{
    const opt=document.createElement('option');
    opt.value=s.name;
    opt.textContent=`${s.name} — ${s.minutes} min ($${s.price})`;
    sel.appendChild(opt);
  });
}

// Admin toggle
$('#adminToggle').addEventListener('click', ()=>{
  if (!ADMIN_ON) {
    if (!requireAdmin()) return;
  } else {
    ADMIN_ON = false;
    try { sessionStorage.removeItem("siman_admin_on"); } catch {}
  }
  $('#adminToggle').textContent = ADMIN_ON ? 'Admin: On' : 'Admin: Off';
  $('#adminPanel').style.display = ADMIN_ON ? 'block':'none';
});

// Calendar + bookings
let selectedDate = new Date(today);
function renderMiniCalendars(){
  const grid = $('#bookingDays'); grid.innerHTML='';
  for(let i=0;i<21;i++){
    const d=new Date(today); d.setDate(d.getDate()+i);
    const key=fmtDate(d);
    const available = (state.availability[key]||[]).length;
    const btn=document.createElement('button');
    btn.className = 'calendar-day ' + (available===0?'disabled':'');
    if(fmtDate(d)===fmtDate(selectedDate)) btn.classList.add('sel');
    btn.innerHTML = `<div style="font-weight:600">${d.toLocaleDateString(undefined,{weekday:'short'})}</div>
      <div class="muted">${d.toLocaleDateString(undefined,{day:'numeric', month:'short'})}</div>
      <div class="small">${available} slots</div>`;
    btn.disabled = available===0;
    btn.addEventListener('click', ()=>{selectedDate=d; renderMiniCalendars(); renderSlots();});
    grid.appendChild(btn);
  }
  const adminGrid = $('#adminDays'); adminGrid.innerHTML='';
  for(let i=0;i<21;i++){
    const d=new Date(today); d.setDate(d.getDate()+i);
    const key=fmtDate(d); const count=(state.availability[key]||[]).length;
    const btn=document.createElement('button');
    btn.className='calendar-day'+(fmtDate(d)===fmtDate(selectedDate)?' sel':'');
    btn.innerHTML = `<div style="font-weight:600">${d.toLocaleDateString(undefined,{weekday:'short'})}</div>
      <div class="muted">${d.toLocaleDateString(undefined,{day:'numeric', month:'short'})}</div>
      <div class="small">${count} slots</div>`;
    btn.addEventListener('click', ()=>{selectedDate=d; renderMiniCalendars(); renderAdminHours();});
    adminGrid.appendChild(btn);
  }
}
function renderSlots(){
  const key=fmtDate(selectedDate);
  const wrap = $('#slots'); wrap.innerHTML='';
  const bookedSet = new Set(state.bookings.map(b=>b.slot));
  const slots = (state.availability[key]||[]).filter(s=>!bookedSet.has(s));
  if(slots.length===0){ wrap.innerHTML=`<div class="muted small">No times available — try another day.</div>`; return; }
  slots.forEach(s=>{
    const d = new Date(s);
    const btn=document.createElement('button');
    btn.className='slot-btn'; btn.textContent=d.toLocaleTimeString([], {hour:'numeric', minute:'2-digit'});
    btn.addEventListener('click', ()=>{
      $$('.slot-btn', wrap).forEach(b=>b.classList.remove('sel'));
      btn.classList.add('sel');
      $('#slotValue').value = s;
    });
    wrap.appendChild(btn);
  });
  $('#pickedDate').textContent = selectedDate.toLocaleDateString(undefined,{weekday:'short', day:'numeric', month:'short'});
}
function renderAdminHours(){
  const key=fmtDate(selectedDate);
  const wrap=$('#adminHours'); wrap.innerHTML='';
  for(let h=0;h<24;h++){
    const slot=toSlot(selectedDate,h);
    const on = (state.availability[key]||[]).includes(slot);
    const btn = document.createElement('button');
    btn.className='slot-btn'+(on?' sel':'');
    btn.textContent = `${String(h).padStart(2,'0')}:00`;
    btn.addEventListener('click', ()=>{
      if (!ADMIN_ON) return;
      const set = new Set(state.availability[key]||[]);
      if(set.has(slot)) set.delete(slot); else set.add(slot);
      state.availability[key] = Array.from(set).sort();
      save(state);
      renderMiniCalendars(); renderAdminHours(); renderSlots();
    });
    wrap.appendChild(btn);
  }
}
$('#open97').addEventListener('click', ()=>{
  if (!ADMIN_ON) return;
  const hours = Array.from({length:11},(_,i)=>9+i);
  const key=fmtDate(selectedDate);
  state.availability[key]=hours.map(h=>toSlot(selectedDate,h));
  save(state); renderMiniCalendars(); renderAdminHours(); renderSlots();
});
$('#closeDay').addEventListener('click', ()=>{
  if (!ADMIN_ON) return;
  const key=fmtDate(selectedDate); state.availability[key]=[]; save(state);
  renderMiniCalendars(); renderAdminHours(); renderSlots();
});
$('#exportJSON').addEventListener('click', ()=>{
  if (!ADMIN_ON) return;
  const blob=new Blob([JSON.stringify(state,null,2)], {type:'application/json'});
  const url=URL.createObjectURL(blob); const a=document.createElement('a');
  a.href=url; a.download='siman_availability_export.json'; a.click(); URL.revokeObjectURL(url);
});
$('#importJSON').addEventListener('change', (e)=>{
  if (!ADMIN_ON) return;
  const f=e.target.files[0]; if(!f) return;
  const reader=new FileReader();
  reader.onload=evt=>{
    try{ state=JSON.parse(String(evt.target.result||'{}')); save(state);
      renderMiniCalendars(); renderAdminHours(); renderSlots();
    }catch{ alert('Invalid JSON'); }
  };
  reader.readAsText(f);
});
$('#bookingForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  const suburb = $('#suburb').value.trim();
  const slot = $('#slotValue').value;
  if(!slot) return alert('Please choose a time.');
  if(!name || !email || !suburb) return alert('Please complete your details.');
  const booking = { id: crypto.randomUUID(), name, email, suburb, service: $('#service').value, slot, notes: $('#notes').value.trim() };
  state.bookings.push(booking); save(state);
  alert('Thanks! Your request has been placed. (Demo)'); $('#bookingForm').reset();
  renderSlots(); renderBookingsTable();
});
function renderBookingsTable(){
  const tbody = $('#bookingsBody'); tbody.innerHTML='';
  if(state.bookings.length===0){ $('#noBookings').style.display='block'; return; }
  $('#noBookings').style.display='none';
  state.bookings.forEach(b=>{
    const tr=document.createElement('tr');
    const when = new Date(b.slot).toLocaleString([], {weekday:'short', day:'numeric', month:'short', hour:'numeric', minute:'2-digit'});
    tr.innerHTML = `<td>${b.name}</td><td class="muted small">${b.service}</td><td>${when}</td><td class="muted small">${b.email}<br/>${b.suburb}</td><td>${b.notes||''}</td>`;
    tbody.appendChild(tr);
  });
}
renderMiniCalendars(); renderSlots(); renderAdminHours(); renderBookingsTable();
if (ADMIN_ON) { $('#adminToggle').textContent = 'Admin: On'; $('#adminPanel').style.display = 'block'; }
})(); 
