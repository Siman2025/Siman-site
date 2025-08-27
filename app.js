
(function(){
const $ = (s, el=document) => el.querySelector(s);
const $$ = (s, el=document) => Array.from(el.querySelectorAll(s));
const fmtDate = (d) => d.toISOString().slice(0,10);
const pad = (n)=> String(n).padStart(2,'0');
const toSlot = (d,h)=> `${fmtDate(d)}T${pad(h)}:00`;
const today = new Date(); today.setHours(0,0,0,0);
const SERVICES = [
  {key:'relaxation', name:'Relaxation Massage', minutes:60, price:109, blurb:'Light–medium pressure to melt stress.', img:'image/Relax.JPG'},
  {key:'deep', name:'Deep Tissue Massage', minutes:60, price:129, blurb:'Target knots and chronic tension.', img:'image/tissue.JPG'},
  {key:'remedial', name:'Remedial Massage', minutes:60, price:139, blurb:'Assessment + treatment for aches and pains.', img:'image/Remedial.JPG'},
  {key:'pregnancy', name:'Pregnancy Massage', minutes:60, price:129, blurb:'Side-lying comfort for mums-to-be (2nd–3rd trimester).', img:'image/preg.JPG'},
  {key:'head', name:'Head Massage', minutes:30, price:55, blurb:'Indian style head massage.', img:'image/head.JPG'},
  {key:'stone', name:'Stone Massage', minutes:60, price:129, img:'image/stone.JPG'},
  {key:'foot', name:'Foot Massage', minutes:60, price:129, img:'image/foot.JPG'},
];

// === Simple admin password gate ===
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

// State
const STORAGE_KEY='siman_availability_v1_static';
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

SERVICES.forEach(s=>{
  // Service info cards
  const c = document.createElement('div');
  c.className = 'card pad service-card';
  c.innerHTML = `
    ${s.img ? `<img class="service-thumb" src="${s.img}" alt="${s.name}">` : ''}
    <div style="font-weight:600">${s.name}</div>
    <div class="muted small">${s.blurb || ''}</div>
    <div class="small" style="margin-top:6px">Duration: ${s.minutes} min</div>
  `;
  servicesWrap.appendChild(c);

  // Pricing cards
  const p = document.createElement('div');
  p.className = 'card pad service-card';
  p.innerHTML = `
    ${s.img ? `<img class="service-thumb" src="${s.img}" alt="${s.name}">` : ''}
    <div style="font-weight:600">${s.name}</div>
    <div style="font-size:26px;font-weight:700;margin-top:8px">
      $${s.price}<span class="muted" style="font-size:14px;font-weight:400"> / ${s.minutes}m</span>
    </div>
    <a href="#booking" class="btn primary" style="margin-top:10px;display:inline-block">Book this</a>
  `;
  pricingWrap.appendChild(p);
});


// Calendars
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

// Admin buttons
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

// Booking form
$('#bookingForm').addEventListener('submit', (e)=>{
  e.preventDefault();
  const name = $('#name').value.trim();
  const email = $('#email').value.trim();
  const suburb = $('#suburb').value.trim();
  const slot = $('#slotValue').value;
  if(!slot) return alert('Please choose a time.');
  if(!name || !email || !suburb) return alert('Please complete your details.');
  const booking = {
    id: crypto.randomUUID(), name, email, suburb,
    service: $('#service').value, slot, notes: $('#notes').value.trim()
  };
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
    const svc = SERVICES.find(s=>s.key===b.service)?.name || b.service;
    tr.innerHTML = `<td>${b.name}</td><td class="muted small">${svc}</td><td>${when}</td><td class="muted small">${b.email}<br/>${b.suburb}</td><td>${b.notes||''}</td><td>${ADMIN_ON?'<button class="btn small" data-id="'+b.id+'">Cancel</button>':''}</td>`;
    tbody.appendChild(tr);
  });
  $$('#bookingsBody button').forEach(btn=>btn.addEventListener('click', ()=>{
    const id=btn.getAttribute('data-id');
    state.bookings = state.bookings.filter(b=>b.id!==id); save(state);
    renderSlots(); renderBookingsTable();
  }));
}

// Initial renders
renderMiniCalendars(); renderSlots(); renderAdminHours(); renderBookingsTable();
if (ADMIN_ON) { $('#adminToggle').textContent = 'Admin: On'; $('#adminPanel').style.display = 'block'; }
})(); 
