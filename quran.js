// quran.js — قارئ قرآن Offline (Karim Games)
// مصدر البيانات: read_data/quran-simple.txt بصيغة: surah|ayah|text
(function(){
  const DATA_URL = "read_data/quran-simple.txt";
  const PACK_META_URL = "assets/audio_packs/meta.json";
  const BISM = "بِسْمِ اللَّهِ الرَّحْمَـٰنِ الرَّحِيمِ";

  const SURAH_NAMES = ["الفاتحة", "البقرة", "آل عمران", "النساء", "المائدة", "الأنعام", "الأعراف", "الأنفال", "التوبة", "يونس", "هود", "يوسف", "الرعد", "إبراهيم", "الحجر", "النحل", "الإسراء", "الكهف", "مريم", "طه", "الأنبياء", "الحج", "المؤمنون", "النور", "الفرقان", "الشعراء", "النمل", "القصص", "العنكبوت", "الروم", "لقمان", "السجدة", "الأحزاب", "سبأ", "فاطر", "يس", "الصافات", "ص", "الزمر", "غافر", "فصلت", "الشورى", "الزخرف", "الدخان", "الجاثية", "الأحقاف", "محمد", "الفتح", "الحجرات", "ق", "الذاريات", "الطور", "النجم", "القمر", "الرحمن", "الواقعة", "الحديد", "المجادلة", "الحشر", "الممتحنة", "الصف", "الجمعة", "المنافقون", "التغابن", "الطلاق", "التحريم", "الملك", "القلم", "الحاقة", "المعارج", "نوح", "الجن", "المزمل", "المدثر", "القيامة", "الإنسان", "المرسلات", "النبأ", "النازعات", "عبس", "التكوير", "الانفطار", "المطففين", "الانشقاق", "البروج", "الطارق", "الأعلى", "الغاشية", "الفجر", "البلد", "الشمس", "الليل", "الضحى", "الشرح", "التين", "العلق", "القدر", "البينة", "الزلزلة", "العاديات", "القارعة", "التكاثر", "العصر", "الهمزة", "الفيل", "قريش", "الماعون", "الكوثر", "الكافرون", "النصر", "المسد", "الإخلاص", "الفلق", "الناس"];

  const elSurah = document.getElementById("surahSel");
  const elGo = document.getElementById("btnGo");
  const elVerses = document.getElementById("verses");
  const elSearch = document.getElementById("search");
  const elClear = document.getElementById("btnClear");
  const elResults = document.getElementById("results");
  const elToast = document.getElementById("toast");

  const elViewMode = document.getElementById("viewMode");
  const elFontSize = document.getElementById("fontSize");
  const elFontSizeVal = document.getElementById("fontSizeVal");
  const elBismSeparate = document.getElementById("bismSeparate");
  const elNumMode = document.getElementById("numMode");

  const elAudioPackSel = document.getElementById("audioPackSel");
  const elReloadPacks = document.getElementById("btnReloadPacks");
  const elPlaySurah = document.getElementById("btnPlaySurah");
  const elStopAudio = document.getElementById("btnStopAudio");
  const audio = document.getElementById("qAudio");

  const pageBar = document.getElementById("pageBar");
  const btnPrevPage = document.getElementById("btnPrevPage");
  const btnNextPage = document.getElementById("btnNextPage");
  const pageInfo = document.getElementById("pageInfo");

  const STORE = "karim_quran_v4";
  const state = {
    data: null,         // Map<int, Array<{a:number,t:string}>>
    packMeta: null,
    currentSurah: 1,
    highlight: null,    // {s,a} official numbering
    viewMode: "mushaf",
    fontSize: 34,
    bismSeparate: true,
    numMode: "official",
    pageIndex: 0,
    pageSize: 12,       // آيات لكل صفحة (تجريبي)
    playing: false,
    playQueue: [],
  };

  function save() {
    try {
      localStorage.setItem(STORE, JSON.stringify({
        currentSurah: state.currentSurah,
        viewMode: state.viewMode,
        fontSize: state.fontSize,
        bismSeparate: state.bismSeparate,
        numMode: state.numMode,
        audioPackId: elAudioPackSel.value || "",
      }));
    } catch(e) {}
  }
  function load() {
    try {
      const raw = localStorage.getItem(STORE);
      if(!raw) return;
      const o = JSON.parse(raw);
      if(o.currentSurah) state.currentSurah = +o.currentSurah;
      if(o.viewMode) state.viewMode = o.viewMode;
      if(o.fontSize) state.fontSize = +o.fontSize;
      if(typeof o.bismSeparate==="boolean") state.bismSeparate = o.bismSeparate;
      if(o.numMode) state.numMode = o.numMode;
      if(o.audioPackId) {
        // بعد تحميل الميتا هنختاره لو موجود
        state._pendingPackId = o.audioPackId;
      }
    } catch(e) {}
  }

  function toast(msg) {
    elToast.style.display="block";
    elToast.textContent = msg;
    setTimeout(()=>{ elToast.style.display="none"; }, 1800);
  }

  function norm(s) {
    // تطبيع بسيط للبحث: إزالة التشكيل + توحيد بعض الحروف
    return (s||"")
      .replace(/[\u064B-\u065F\u0670\u06D6-\u06ED]/g,"") // تشكيل
      .replace(/ـ/g,"") // تطويل
      .replace(/[إأآا]/g,"ا")
      .replace(/ى/g,"ي")
      .replace(/ؤ/g,"و")
      .replace(/ئ/g,"ي")
      .trim();
  }

  async function loadData() {
    const r = await fetch(DATA_URL);
    if(!r.ok) throw new Error("فشل تحميل نص القرآن");
    const txt = await r.text();
    const map = new Map();
    const lines = txt.split(/\r?\n/);
    for(const line of lines){
      if(!line) continue;
      const parts = line.split("|");
      if(parts.length < 3) continue;
      const s = +parts[0], a = +parts[1];
      const t = parts.slice(2).join("|").trim();
      if(!map.has(s)) map.set(s, []);
      map.get(s).push({a,t});
    }
    // تأكد من الترتيب
    for(const [s,arr] of map.entries()) arr.sort((x,y)=>x.a-y.a);
    state.data = map;
  }

  function buildSurahSelect(){
    elSurah.innerHTML = "";
    for(let i=1;i<=114;i++) {
      const op=document.createElement("option");
      op.value = String(i);
      op.textContent = i + " — " + (SURAH_NAMES[i-1]||("سورة "+i));
      elSurah.appendChild(op);
    }
    elSurah.value = String(state.currentSurah);
  }

  function splitBismIfNeeded(surahNum, verseText) {
    // لو البسملة موجودة في أول الآية: نفصلها كسطر مستقل
    if(!state.bismSeparate) return { bism: null, rest: verseText };
    if(!verseText) return { bism:null, rest: verseText };
    if(verseText === BISM) return { bism: BISM, rest: "" };
    if(verseText.startsWith(BISM+" ")) return { bism: BISM, rest: verseText.slice((BISM+" ").length).trim() };
    return { bism: null, rest: verseText };
  }

  function setViewMode(mode) {
    state.viewMode = mode;
    elVerses.classList.remove("mushaf","cards","pages");
    elVerses.classList.add(mode);
    pageBar.style.display = (mode==="pages") ? "flex" : "none";
    save();
  }

  function setFontSize(px) {
    state.fontSize = px;
    document.documentElement.style.setProperty("--qFontSize", px+"px");
    elFontSizeVal.textContent = String(px);
    save();
  }

  function verseNode({s,a, displayNum, text, isBism=false}) {
    const wrap = document.createElement("span");
    wrap.className = "ayah" + (state.highlight && state.highlight.s===s && state.highlight.a===a ? " highlight" : "");
    if(isBism) wrap.classList.add("bismillah");

    const t = document.createElement("span");
    t.className = "ayahText";
    t.textContent = text;

    if(isBism) {
      wrap.appendChild(t);
      return wrap;
    }

    if(state.viewMode==="cards") {
      wrap.classList.add("cardAyah");
      const num = document.createElement("span");
      num.className = "ayahNum";
      num.textContent = displayNum;
      wrap.appendChild(num);
      wrap.appendChild(t);
      wrap.dataset.s = String(s);
      wrap.dataset.a = String(a);
      wrap.onclick = ()=>playSingleAyah(s,a);
      return wrap;
    }

    // mushaf/pages
    const num = document.createElement("span");
    num.className = "ayahNum";
    num.textContent = displayNum;

    const sep = document.createElement("span");
    sep.className = "ayahSep";
    sep.textContent = "۝";

    wrap.appendChild(t);
    wrap.appendChild(num);
    wrap.appendChild(sep);

    wrap.dataset.s = String(s);
    wrap.dataset.a = String(a);
    wrap.onclick = ()=>playSingleAyah(s,a);

    return wrap;
  }

  function renderSurah(surahNum, opts={}) {
    if(!state.data) return;
    const s = +surahNum;
    state.currentSurah = s;
    elSurah.value = String(s);

    const arr = state.data.get(s) || [];
    elVerses.innerHTML = "";
    state.pageIndex = 0;

    const mode = state.viewMode;
    setViewMode(mode);

    // تحديد البسملة:
    // - سورة التوبة (9) لا بسملة غالبًا
    let injectedBism = false;

    function buildRenderableList() {
      const out = [];
      let seq = 1;

      for(const v of arr) {
        let t = v.t;

        // فصل البسملة من أول آية إن وجدت
        if(v.a===1 && s!==9) {
          const sp = splitBismIfNeeded(s, t);
          if(sp.bism) {
            out.push({s, a:v.a, displayNum:"", text: sp.bism, isBism:true});
            injectedBism = true;
            t = sp.rest;
          }
        }

        if(!t) continue;

        const displayNum = (state.numMode==="official") ? String(v.a) : String(seq++);
        out.push({s, a:v.a, displayNum, text:t, isBism:false});
      }
      return out;
    }

    const renderList = buildRenderableList();

    if(mode==="pages") {
      renderPages(renderList);
    } else {
      for(const item of renderList) {
        elVerses.appendChild(verseNode(item));
        if(mode==="cards") elVerses.appendChild(document.createElement("div"));
      }
    }

    save();
    if(opts.toast) toast(opts.toast);
  }

  function renderPages(renderList) {
    const total = Math.max(1, Math.ceil(renderList.length / state.pageSize));
    state.pageIndex = Math.max(0, Math.min(state.pageIndex, total-1));

    const start = state.pageIndex * state.pageSize;
    const end = Math.min(renderList.length, start + state.pageSize);
    elVerses.innerHTML = "";

    for(let i=start;i<end;i++) {
      elVerses.appendChild(verseNode(renderList[i]));
      elVerses.appendChild(document.createElement("div"));
    }

    pageInfo.textContent = "صفحة " + (state.pageIndex+1) + " / " + total + " (تجريبي)";
    btnPrevPage.disabled = state.pageIndex===0;
    btnNextPage.disabled = state.pageIndex>=total-1;

    btnPrevPage.onclick = ()=>{ state.pageIndex--; renderPages(renderList); };
    btnNextPage.onclick = ()=>{ state.pageIndex++; renderPages(renderList); };
  }

  function jumpTo(s,a) {
    state.highlight = {s,a};
    state.currentSurah = s;
    // إعادة رسم السورة ثم اسكرول للآية
    renderSurah(s);
    setTimeout(()=>{
      const node = elVerses.querySelector(`[data-s="${s}"][data-a="${a}"]`);
      if(node) node.scrollIntoView({behavior:"smooth", block:"center"});
    }, 50);
  }

  function doSearch(q) {
    const query = norm(q);
    elResults.innerHTML = "";
    if(!query || query.length < 2) return;

    const items = [];
    for(let s=1;s<=114;s++) {
      const arr = state.data.get(s) || [];
      for(const v of arr) {
        const hay = norm(v.t);
        if(hay.includes(query)) {
          items.push({s, a:v.a, t:v.t});
          if(items.length>=80) break;
        }
      }
      if(items.length>=80) break;
    }

    if(items.length===0) {
      const d=document.createElement("div");
      d.className="resItem";
      d.textContent="لا توجد نتائج.";
      elResults.appendChild(d);
      return;
    }

    for(const it of items) {
      const d=document.createElement("div");
      d.className="resItem";
      const name = SURAH_NAMES[it.s-1] || ("سورة "+it.s);
      d.innerHTML = `<div style="opacity:.9;margin-bottom:6px">سورة: ${name} — آية: ${it.a}</div><div class="qFontMushaf" style="font-size:24px;line-height:1.9">${it.t}</div>`;
      d.onclick = ()=>jumpTo(it.s, it.a);
      elResults.appendChild(d);
    }
  }

  async function loadPacks() {
    elAudioPackSel.innerHTML = `<option value="">بدون صوت</option>`;
    state.packMeta = null;

    try {
      const r = await fetch(PACK_META_URL, { cache:"no-store" });
      if(!r.ok) throw new Error("no meta");
      const meta = await r.json();
      state.packMeta = meta;

      const packs = (meta && meta.packs) ? meta.packs : [];
      for(const p of packs) {
        const op=document.createElement("option");
        op.value = p.id;
        op.textContent = p.name || p.id;
        op.dataset.basePath = p.basePath || "";
        op.dataset.format = p.format || "m4a";
        op.dataset.naming = p.naming || "SSS_AAA.m4a";
        elAudioPackSel.appendChild(op);
      }

      // اختيار الافتراضي
      const want = state._pendingPackId || meta.defaultPackId || "";
      if(want) {
        const ok = [...elAudioPackSel.options].some(o=>o.value===want);
        if(ok) elAudioPackSel.value = want;
      }
      state._pendingPackId = null;
    } catch(e) {
      // لا توجد حزم — عادي
    }
    save();
  }

  function currentPack() {
    const id = elAudioPackSel.value;
    if(!id) return null;
    const op = [...elAudioPackSel.options].find(o=>o.value===id);
    if(!op) return null;
    return {
      id,
      basePath: op.dataset.basePath || `assets/audio_packs/${id}`,
      format: op.dataset.format || "m4a",
    };
  }

  function fileName(s,a,format) {
    const S = String(s).padStart(3,"0");
    const A = String(a).padStart(3,"0");
    return `${S}_${A}.${format||"m4a"}`;
  }

  function playSingleAyah(s,a) {
    const pack = currentPack();
    if(!pack) return;
    const url = pack.basePath.replace(/\/$/,"") + "/" + fileName(s,a,pack.format);
    audio.src = url;
    audio.play().catch(()=>{});
  }

  function stopAudio() {
    state.playing = false;
    state.playQueue = [];
    audio.pause();
    audio.currentTime = 0;
  }

  function buildSurahQueue(surahNum) {
    const pack = currentPack();
    if(!pack) return [];
    const arr = state.data.get(+surahNum) || [];
    const q = [];
    for(const v of arr) {
      // لو البسملة منفصلة: لا نعيد تشغيلها كآية إن كانت مضمّنة في أول آية (نحاول تشغيل الآية نفسها فقط)
      // لأن الملفات عادة تبع الآية الرسمية
      q.push({s:+surahNum,a:v.a});
    }
    return q;
  }

  function playSurah() {
    const pack = currentPack();
    if(!pack) {
      toast("لا توجد حزمة صوت.");
      return;
    }
    stopAudio();
    state.playQueue = buildSurahQueue(state.currentSurah);
    if(state.playQueue.length===0) return;

    state.playing = true;
    const next = () => {
      if(!state.playing) return;
      const it = state.playQueue.shift();
      if(!it) {
        state.playing = false;
        return;
      }
      const url = pack.basePath.replace(/\/$/,"") + "/" + fileName(it.s,it.a,pack.format);
      audio.src = url;
      audio.play().catch(()=>{
        // لو الملف مفقود: تخطي
        setTimeout(next, 80);
      });
    };

    audio.onended = () => next();
    audio.onerror = () => setTimeout(next, 80);
    next();
  }

  function bindUI() {
    elGo.onclick = ()=>renderSurah(+elSurah.value, {toast:"تم فتح السورة"});

    elViewMode.onchange = ()=>{ setViewMode(elViewMode.value); renderSurah(state.currentSurah); };
    elFontSize.oninput = ()=>setFontSize(+elFontSize.value);
    elBismSeparate.onchange = ()=>{ state.bismSeparate = elBismSeparate.checked; renderSurah(state.currentSurah); save(); };
    elNumMode.onchange = ()=>{ state.numMode = elNumMode.value; renderSurah(state.currentSurah); save(); };

    elSearch.oninput = ()=>doSearch(elSearch.value);
    elClear.onclick = ()=>{ elSearch.value=""; elResults.innerHTML=""; state.highlight=null; };

    elReloadPacks.onclick = ()=>loadPacks().then(()=>toast("تم التحديث"));
    elPlaySurah.onclick = ()=>playSurah();
    elStopAudio.onclick = ()=>stopAudio();

    // حفظ التغييرات
    elAudioPackSel.onchange = ()=>save();
  }

  async function boot() {
    load();
    setFontSize(state.fontSize);
    elViewMode.value = state.viewMode;
    elBismSeparate.checked = state.bismSeparate;
    elNumMode.value = state.numMode;

    await loadData();
    buildSurahSelect();
    bindUI();
    await loadPacks();

    renderSurah(state.currentSurah);
  }

  boot().catch(e=>toast("خطأ: "+(e && e.message ? e.message : e)));
})();
