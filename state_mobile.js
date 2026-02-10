/* state_mobile.js - viewport fit + play mode */
(function(){
  const isMobile = window.matchMedia('(pointer: coarse)').matches || window.innerWidth < 820;

  function setVH(){
    // fix 100vh on mobile browsers
    const vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');
  }
  setVH();
  window.addEventListener('resize', ()=>{ setVH(); tryKickResize(); });

  function tryKickResize(){
    // If game uses canvas sizing on resize, ensure it happens after UI changes
    try { window.dispatchEvent(new Event('resize')); } catch {}
  }

  function qs(id){ return document.getElementById(id); }
  const btnPlay = qs('btnPlay');
  const btnUI = qs('btnUI');
  const btnNew = qs('btnNew');

  function enterPlay(){
    document.body.classList.add('playing');
    tryKickResize();
    // sometimes canvas map is tiny before "New" is clicked on mobile; kick once
    if(btnNew) setTimeout(()=>{ try{ btnNew.click(); }catch{} }, 80);
  }
  function exitPlay(){
    document.body.classList.remove('playing');
    tryKickResize();
  }

  if(isMobile){
    if(btnPlay) btnPlay.addEventListener('click', (e)=>{ e.preventDefault(); enterPlay(); });
    if(btnUI) btnUI.addEventListener('click', (e)=>{ e.preventDefault(); exitPlay(); });
  } else {
    // hide play bar on desktop just in case
    const bar = qs('mobilePlayBar');
    if(bar) bar.style.display = 'none';
  }

// ===== شريط تحكم موبايل للاعبين (بديل تقسيم الشاشة) =====
function isTouchDevice(){
  return ("ontouchstart" in window) || (navigator.maxTouchPoints>0);
}
function ensurePlayerBar(){
  if(!isTouchDevice()) return;
  if(document.getElementById("pbar2p")) return;

  const canvas = document.getElementById("canvas") || document.querySelector("canvas");
  if(!canvas) return;

  const bar = document.createElement("div");
  bar.id = "pbar2p";
  bar.style.cssText = [
    "position:fixed","left:10px","right:10px","bottom:10px",
    "display:flex","gap:10px","z-index:9999","justify-content:space-between",
    "background:rgba(0,0,0,.45)","backdrop-filter: blur(10px)",
    "border:1px solid rgba(255,255,255,.16)","border-radius:14px",
    "padding:10px"
  ].join(";");

  const mkBtn = (txt, owner)=> {
    const b=document.createElement("button");
    b.textContent = txt;
    b.style.cssText = [
      "flex:1","padding:12px 10px","border-radius:12px",
      "border:1px solid rgba(255,255,255,.18)",
      "background:rgba(255,255,255,.08)",
      "color:rgba(255,255,255,.92)","font-size:14px","cursor:pointer"
    ].join(";");
    b.onclick = ()=>setActive(owner);
    return b;
  };

  const auto = document.createElement("button");
  auto.id="pbarAuto";
  auto.textContent="تبديل تلقائي: تشغيل";
  auto.style.cssText = [
    "flex:1","padding:12px 10px","border-radius:12px",
    "border:1px solid rgba(255,255,255,.18)",
    "background:rgba(255,255,255,.08)",
    "color:rgba(255,255,255,.92)","font-size:14px","cursor:pointer"
  ].join(";");

  const b1 = mkBtn("لاعب 1", 1);
  const b2 = mkBtn("لاعب 2", 2);

  function paint(){
    const a = (window.stateInput && window.stateInput.activeOwner) ? window.stateInput.activeOwner : 1;
    b1.style.outline = (a===1) ? "2px solid rgba(255,59,48,.65)" : "none";
    b2.style.outline = (a===2) ? "2px solid rgba(10,132,255,.65)" : "none";
    const on = !!(window.stateInput && window.stateInput.autoSwap);
    auto.textContent = "تبديل تلقائي: " + (on ? "تشغيل" : "إيقاف");
  }

  function setActive(owner){
    window.stateInput = window.stateInput || { activeOwner: 1, autoSwap: true };
    window.stateInput.activeOwner = owner;
    paint();
  }

  auto.onclick = ()=>{
    window.stateInput = window.stateInput || { activeOwner: 1, autoSwap: true };
    window.stateInput.autoSwap = !window.stateInput.autoSwap;
    paint();
  };

  // افتراضي
  window.stateInput = window.stateInput || { activeOwner: 1, autoSwap: true };
  paint();

  // تبديل تلقائي بعد كل لمسة/حركة مؤكدة
  canvas.addEventListener("pointerup", ()=>{
    if(!(window.stateInput && window.stateInput.autoSwap)) return;
    const a = window.stateInput.activeOwner || 1;
    window.stateInput.activeOwner = (a===1) ? 2 : 1;
    paint();
  });

  bar.appendChild(b1);
  bar.appendChild(b2);
  bar.appendChild(auto);
  document.body.appendChild(bar);
}

document.addEventListener("DOMContentLoaded", ()=>setTimeout(ensurePlayerBar, 80));

})();