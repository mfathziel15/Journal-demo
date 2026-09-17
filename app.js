(() => {
"use strict";
const KEY_NOTES="projournal_ultimate_notes_v3", KEY_ROUTINES="projournal_ultimate_routines_v3";
let notes=load(KEY_NOTES), routines=load(KEY_ROUTINES), activeFilter="all";
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
function load(k){try{return JSON.parse(localStorage.getItem(k))||[]}catch{return[]}}
function persist(){localStorage.setItem(KEY_NOTES,JSON.stringify(notes));localStorage.setItem(KEY_ROUTINES,JSON.stringify(routines))}
const esc=s=>String(s).replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[m]));
function toast(title,msg){const el=document.createElement("div");el.className="toast";el.innerHTML=`<b>${esc(title)}</b><span>${esc(msg)}</span>`;$("#toastContainer").append(el);gsap.fromTo(el,{x:40,opacity:0},{x:0,opacity:1,duration:.45,ease:"power3.out"});setTimeout(()=>gsap.to(el,{x:40,opacity:0,duration:.35,onComplete:()=>el.remove()}),3500)}
function updateClock(){const n=new Date();$("#currentDate").textContent=n.toLocaleDateString("id-ID",{weekday:"short",day:"numeric",month:"short",year:"numeric"}).toUpperCase();$("#currentTime").textContent=n.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"});}
function updateStats(){$("#statNotes").textContent=notes.length;$("#statRoutines").textContent=routines.filter(x=>new Date(x.time)>new Date()).length;$("#agendaCount").textContent=`${routines.length} ITEMS`}
function renderNotes(){
 const q=$("#searchInput").value.trim().toLowerCase();
 const arr=notes.filter(n=>(activeFilter==="all"||n.category===activeFilter)&&(`${n.title} ${n.content}`).toLowerCase().includes(q));
 const c=$("#notesContainer");
 if(!arr.length){c.innerHTML='<div class="empty">NO NOTES YET — YOUR NEXT IDEA CAN START HERE.</div>';return}
 c.innerHTML=arr.map(n=>`<article class="note-card tilt reveal"><div><div class="note-top"><span class="tag">${esc(n.category)}</span><button class="delete" aria-label="Hapus" onclick="window.deleteNote(${n.id})">×</button></div><h3 class="note-title">${esc(n.title)}</h3><p class="note-content">${esc(n.content)}</p></div><span class="note-date">${esc(n.date)}</span></article>`).join("");
 animateReveals();
}
function renderRoutines(){
 const now=Date.now(); const c=$("#routinesContainer");
 routines.sort((a,b)=>new Date(a.time)-new Date(b.time));
 if(!routines.length){c.innerHTML='<div class="routine-item"><span></span><div class="routine-title">No moments scheduled.</div></div>';updateStats();return}
 c.innerHTML=routines.map(r=>{const d=new Date(r.time),past=d.getTime()<now;return `<div class="routine-item ${past?"past":""}"><div class="routine-date">${d.toLocaleDateString("id-ID",{day:"2-digit",month:"short"}).toUpperCase()}</div><div><div class="routine-title">${esc(r.title)}</div><div class="routine-time">${d.toLocaleTimeString("id-ID",{hour:"2-digit",minute:"2-digit"})}</div></div><button class="routine-done" onclick="window.deleteRoutine(${r.id})" aria-label="Selesai">○</button></div>`}).join("");
 updateStats();
}
window.deleteNote=id=>{if(!confirm("Hapus catatan ini?"))return;notes=notes.filter(n=>n.id!==id);persist();renderNotes();updateStats();toast("NOTE REMOVED","Catatan berhasil dihapus.")};
window.deleteRoutine=id=>{routines=routines.filter(r=>r.id!==id);persist();renderRoutines();toast("AGENDA CLEARED","Moment dihapus dari timeline.")};
function openModal(id){$("#"+id).classList.add("open");gsap.fromTo("#"+id+" .modal-card",{y:40,opacity:0,scale:.98},{y:0,opacity:1,scale:1,duration:.5,ease:"power3.out"})}
function closeModals(){$$(".modal.open").forEach(m=>m.classList.remove("open"))}
function setupUI(){
 $$(".nav-link").forEach(a=>a.addEventListener("click",()=>$("#sidebar").classList.remove("open")));
 $("#openSidebar").onclick=()=>{$("#sidebar").classList.add("open");$("#overlay").classList.add("open")};
 $("#closeSidebar").onclick=$("#overlay").onclick=()=>{$("#sidebar").classList.remove("open");$("#overlay").classList.remove("open")};
 $$("[data-modal]").forEach(b=>b.onclick=()=>openModal(b.dataset.modal));
 $$("[data-close]").forEach(b=>b.onclick=closeModals);
 $$(".modal").forEach(m=>m.addEventListener("click",e=>{if(e.target===m)closeModals()}));
 $("#searchInput").addEventListener("input",renderNotes);
 $$(".filter").forEach(b=>b.onclick=()=>{$$(".filter").forEach(x=>x.classList.remove("active"));b.classList.add("active");activeFilter=b.dataset.filter;renderNotes()});
 $("#noteForm").onsubmit=e=>{e.preventDefault();const title=$("#noteTitle").value.trim(),content=$("#noteContent").value.trim();if(!title||!content)return;notes.unshift({id:Date.now(),title,content,category:$("#noteCategory").value,date:new Date().toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"})});persist();e.target.reset();closeModals();renderNotes();updateStats();toast("NOTE SAVED","Your thought is safely stored locally.")};
 $("#routineForm").onsubmit=e=>{e.preventDefault();const title=$("#routineTitle").value.trim(),time=$("#routineTime").value;if(!title||!time)return;routines.push({id:Date.now(),title,time,notified:false});persist();e.target.reset();closeModals();renderRoutines();toast("REMINDER SET","Agenda added to your timeline.")};
 $("#btnNotif").onclick=requestNotifications;
}
async function requestNotifications(){if(!("Notification"in window)){toast("NOT AVAILABLE","Browser ini tidak mendukung notifikasi.");return}if(Notification.permission==="granted"){toast("ALREADY ACTIVE","Notifikasi sudah aktif.");return}const p=await Notification.requestPermission();toast(p==="granted"?"ACCESS GRANTED":"ACCESS DENIED",p==="granted"?"System notifications are on.":"Notification permission was not granted.")}
function checkAlarms(){const now=Date.now();let changed=false;routines.forEach(r=>{if(!r.notified&&new Date(r.time).getTime()<=now){r.notified=true;changed=true;if("Notification"in window&&Notification.permission==="granted")new Notification("ProJournal",{body:r.title});toast("⏰ MOMENT NOW",r.title)}});if(changed){persist();renderRoutines()}}
function motion(){
 gsap.registerPlugin(ScrollTrigger);
 if(window.Lenis){const lenis=new Lenis({duration:1.15,smoothWheel:true});lenis.on("scroll",ScrollTrigger.update);gsap.ticker.add(t=>lenis.raf(t*1000));gsap.ticker.lagSmoothing(0)}
 const tl=gsap.timeline({defaults:{ease:"power4.out"}});
 tl.to(".loader-line span",{width:"100%",duration:1.2}).to(".loader-mark",{y:-10,opacity:0,duration:.35},"-=.2").to(".loader",{yPercent:-100,duration:.9,ease:"expo.inOut"}).from(".hero-title .line",{y:90,opacity:0,stagger:.1,duration:1},"-=.35").from(".hero .eyebrow,.hero-lead,.hero-cta",{y:25,opacity:0,stagger:.08,duration:.7},"-=.65");
 animateReveals();
 $$(".tilt").forEach(el=>{el.addEventListener("mousemove",e=>{const r=el.getBoundingClientRect(),x=(e.clientX-r.left)/r.width-.5,y=(e.clientY-r.top)/r.height-.5;gsap.to(el,{rotationY:x*5,rotationX:-y*5,transformPerspective:700,duration:.35})});el.addEventListener("mouseleave",()=>gsap.to(el,{rotationY:0,rotationX:0,duration:.5}))});
 if(matchMedia("(pointer:fine)").matches){const dot=$(".cursor-dot"),ring=$(".cursor-ring");window.addEventListener("mousemove",e=>{gsap.to(dot,{x:e.clientX-3,y:e.clientY-3,duration:.08});gsap.to(ring,{x:e.clientX,y:e.clientY,duration:.35,ease:"power3.out"})});$$("a,button,.note-card").forEach(el=>{el.addEventListener("mouseenter",()=>gsap.to(ring,{scale:1.5,opacity:.15}));el.addEventListener("mouseleave",()=>gsap.to(ring,{scale:1,opacity:.35}))})}
 $$(".magnetic").forEach(el=>{el.addEventListener("mousemove",e=>{const r=el.getBoundingClientRect();gsap.to(el,{x:(e.clientX-r.left-r.width/2)*.12,y:(e.clientY-r.top-r.height/2)*.12,duration:.3})});el.addEventListener("mouseleave",()=>gsap.to(el,{x:0,y:0,duration:.5}) )});
}
function animateReveals(){if(!window.gsap)return;$$(".reveal").forEach(el=>{if(el.dataset.animated)return;el.dataset.animated="1";gsap.fromTo(el,{y:35,opacity:0},{y:0,opacity:1,duration:.8,scrollTrigger:{trigger:el,start:"top 88%",once:true},ease:"power3.out"})})}
document.addEventListener("DOMContentLoaded",()=>{updateClock();setInterval(updateClock,30000);setInterval(checkAlarms,1000);setupUI();renderNotes();renderRoutines();motion();if("serviceWorker"in navigator)navigator.serviceWorker.register("sw.js").catch(()=>{});});
})();