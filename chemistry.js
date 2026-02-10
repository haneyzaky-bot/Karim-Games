/* chemistry.js — بنك أسئلة أكبر + منع التكرار + Shuffle (Offline) */
(function(){
  const LS="karim_chem_v2";
  const USED_KEY=LS+"_used";
  const STATE_KEY=LS+"_state";

  const $=id=>document.getElementById(id);
  const elHearts=$("hearts");
  const elXp=$("xp");
  const elTitle=$("qtitle");
  const elBody=$("qbody");
  const elActions=$("qactions");
  const elCheck=$("check");
  const elSkip=$("skip");
  const elToast=$("toast");
  const elReset=$("reset");

  function toast(msg){
    elToast.textContent=msg;
    elToast.style.opacity="1";
    setTimeout(()=>{ elToast.style.opacity="0"; }, 1600);
  }

  function loadUsed(){
    try{ return JSON.parse(localStorage.getItem(USED_KEY)||"{}"); }catch{ return {}; }
  }
  function saveUsed(u){
    try{ localStorage.setItem(USED_KEY, JSON.stringify(u)); }catch{}
  }
  function loadState(){
    try{ return JSON.parse(localStorage.getItem(STATE_KEY)||"{}"); }catch{ return {}; }
  }
  function saveState(s){
    try{ localStorage.setItem(STATE_KEY, JSON.stringify(s)); }catch{}
  }

  function shuffle(arr){
    for(let i=arr.length-1;i>0;i--){
      const j=Math.floor(Math.random()*(i+1));
      [arr[i],arr[j]]=[arr[j],arr[i]];
    }
    return arr;
  }

  const BANK=[
    // ===== أساسيات =====
    {id:"b1",diff:"easy",q:"ما عدد إلكترونات التكافؤ للغازات النبيلة غالبًا؟",choices:["1","2","8","10"],ans:"8",ex:"معظم الغازات النبيلة لها غلاف تكافؤ مكتمل (8) عدا الهيليوم (2)."},
    {id:"b2",diff:"easy",q:"الرابطة الأيونية تنتج غالبًا من...",choices:["مشاركة إلكترونات","انتقال إلكترونات","انضغاط نواة","تحويل بروتون"],ans:"انتقال إلكترونات",ex:"تنتقل إلكترونات من فلز إلى لافلز فتتكون أيونات متجاذبة."},
    {id:"b3",diff:"easy",q:"رمز عنصر الصوديوم هو:",choices:["So","Na","S","No"],ans:"Na",ex:"Na من الاسم اللاتيني Natrium."},
    {id:"b4",diff:"easy",q:"الأحماض في الماء تُعطي:",choices:["OH−","H+ / H3O+","Na+","Cl−"],ans:"H+ / H3O+",ex:"تعريف أرهينيوس: الحمض يعطي +H في الماء."},
    {id:"b5",diff:"easy",q:"عدد البروتونات يساوي:",choices:["العدد الكتلي","العدد الذري","عدد النيوترونات","عدد المدارات"],ans:"العدد الذري",ex:"العدد الذري = عدد البروتونات."},

    // ===== دورية / فلزات / نشاط =====
    {id:"p1",diff:"easy",q:"في الجدول الدوري: تزداد الصفة الفلزية عمومًا باتجاه...",choices:["أعلى يمين","أسفل يسار","أعلى يسار","أسفل يمين"],ans:"أسفل يسار",ex:"الفلزية تزداد نزولًا في المجموعة ويسارًا في الدورة."},
    {id:"p2",diff:"medium",q:"من الأكثر نشاطًا (ضمن الفلزات القلوية):",choices:["Li","Na","K","Rb"],ans:"Rb",ex:"النشاط يزداد نزولًا في المجموعة الأولى."},
    {id:"p3",diff:"medium",q:"لماذا يقل نصف القطر الذري عبر الدورة من اليسار لليمين؟",choices:["لأن عدد البروتونات يقل","لأن الشحنة النووية الفعالة تزيد","لأن عدد المدارات يزيد","لأن الإلكترونات تختفي"],ans:"لأن الشحنة النووية الفعالة تزيد",ex:"زيادة Z_eff تجذب الإلكترونات أقوى."},

    // ===== محاليل / أحماض قواعد =====
    {id:"a1",diff:"easy",q:"pH لمحلول متعادل تقريبًا يساوي:",choices:["1","7","9","14"],ans:"7",ex:"عند 25°م الماء المتعادل pH≈7."},
    {id:"a2",diff:"medium",q:"أي مادة تُعد قاعدة أرهينيوس؟",choices:["HCl","NaOH","CO2","NaCl"],ans:"NaOH",ex:"NaOH يعطي OH− في الماء."},
    {id:"a3",diff:"medium",q:"عند تخفيف حمض بالماء، تركيز +H:",choices:["يزيد","يقل","يثبت","يتحول إلى بروتونات صلبة"],ans:"يقل",ex:"التخفيف يقلل التركيز."},

    // ===== حسابات بسيطة =====
    {id:"s1",diff:"medium",q:"كتلة مول واحد من H2O تساوي (جم):",choices:["16","18","20","22"],ans:"18",ex:"H2O: 2×1 + 16 = 18."},
    {id:"s2",diff:"medium",q:"عدد مولات 22 جم CO2 =",choices:["0.25","0.5","1","2"],ans:"0.5",ex:"الكتلة المولية 44 جم، 22/44=0.5."},
    {id:"s3",diff:"hard",q:"إذا كان لدينا 0.2 مول NaCl، عدد الجسيمات =",choices:["1.2×10^23","6.02×10^23","3.01×10^23","9.0×10^22"],ans:"1.2×10^23",ex:"N = n×NA = 0.2×6.02e23 ≈ 1.2e23."},

    // ===== تفاعلات =====
    {id:"r1",diff:"easy",q:"في تفاعل الاحتراق الكامل للهيدروكربونات الناتج الأساسي:",choices:["CO فقط","CO2 و H2O","H2 فقط","N2"],ans:"CO2 و H2O",ex:"الاحتراق الكامل يعطي ثاني أكسيد الكربون والماء."},
    {id:"r2",diff:"medium",q:"المعادلة الموزونة لتكوين الماء: 2H2 + O2 → ?",choices:["H2O","2H2O","H2O2","4H2O"],ans:"2H2O",ex:"2H2 + O2 → 2H2O."},
    {id:"r3",diff:"medium",q:"إزاحة فلز: Zn + CuSO4 →",choices:["ZnSO4 + Cu","Cu + SO4","Zn + Cu","ZnSO4 فقط"],ans:"ZnSO4 + Cu",ex:"الزنك أنشط من النحاس فيزيحه."},

    // ===== روابط / تركيب =====
    {id:"bnd1",diff:"medium",q:"أقوى ترابطًا عادة:",choices:["روابط هيدروجينية","قوى فان ديرفال","روابط تساهمية","روابط أيونية"],ans:"روابط أيونية",ex:"داخل الشبكات البلورية تكون قوية جدًا مقارنة بالقوى بين الجزيئات."},
    {id:"bnd2",diff:"hard",q:"المركب القطبي غالبًا ينتج عن:",choices:["تساوي السالبية","فرق سالبية كبير جدًا (أيونية)","فرق سالبية متوسط","عدم وجود إلكترونات"],ans:"فرق سالبية متوسط",ex:"الفرق المتوسط يعطي تساهمية قطبية."},

    // ===== إضافات تدريجية (بنك أكبر) =====
  ];

  // توليد أسئلة إضافية تلقائيًا (لزيادة البنك تدريجيًا)
  (function addGenerated(){
    const elems=[
      ["H","هيدروجين"],["He","هيليوم"],["C","كربون"],["N","نيتروجين"],["O","أكسجين"],["Na","صوديوم"],["Mg","مغنيسيوم"],["Al","ألومنيوم"],["Cl","كلور"],["K","بوتاسيوم"],["Ca","كالسيوم"],["Fe","حديد"],["Cu","نحاس"],["Zn","زنك"]
    ];
    let k=1;
    for(const [sym,name] of elems){
      BANK.push({
        id:"sym_"+k,
        diff: k<=6 ? "easy" : k<=10 ? "medium" : "hard",
        q:"ما اسم العنصر ذو الرمز: "+sym+" ؟",
        choices: shuffle([name,"عنصر آخر 1","عنصر آخر 2","عنصر آخر 3"].slice()),
        ans:name,
        ex:"الرمز الصحيح هو "+sym+" = "+name+"."
      });
      k++;
    }
  })();

  const st = Object.assign({hearts:3,xp:0,level:1,lastId:null}, loadState());
  const used = loadUsed();

  function levelLimit(){
    // فتح البنك تدريجيًا: كل ما xp يزيد نسمح بأصعب/أكثر
    if(st.xp<60) return "easy";
    if(st.xp<160) return "medium";
    return "hard";
  }

  function allowedDiffs(){
    const lim=levelLimit();
    if(lim==="easy") return ["easy"];
    if(lim==="medium") return ["easy","medium"];
    return ["easy","medium","hard"];
  }

  function pickQuestion(){
    const diffs = allowedDiffs();
    const pool = BANK.filter(q=>diffs.includes(q.diff));
    // منع تكرار السؤال السابق مباشرة
    const pool2 = pool.filter(q=>q.id!==st.lastId);
    const p = pool2.length?pool2:pool;

    // اختر الأقل استخدامًا
    let min=1e9;
    for(const q of p){
      const c = used[q.id]||0;
      if(c<min) min=c;
    }
    const candidates = p.filter(q=>(used[q.id]||0)===min);
    return candidates[Math.floor(Math.random()*candidates.length)];
  }

  let current=null;
  let selected=null;

  function renderHearts(){
    elHearts.textContent = "❤".repeat(st.hearts) + "♡".repeat(Math.max(0,3-st.hearts));
  }
  function renderXp(){
    elXp.textContent = "XP: " + st.xp + " — المستوى: " + (st.level||1);
  }

  function renderQuestion(){
    selected=null;
    current = pickQuestion();
    st.lastId = current.id;
    saveState(st);

    elTitle.textContent = "اختبار كيمياء (Offline)";
    elBody.textContent = current.q;

    // خيارات مع Shuffle
    const choices = shuffle(current.choices.slice());

    elActions.innerHTML="";
    for(const c of choices){
      const b=document.createElement("button");
      b.className="ans";
      b.textContent=c;
      b.onclick=()=>{
        [...elActions.querySelectorAll(".ans")].forEach(x=>x.classList.remove("pick"));
        b.classList.add("pick");
        selected=c;
      };
      elActions.appendChild(b);
    }
    elCheck.disabled=false;
  }

  function correct(){
    used[current.id] = (used[current.id]||0)+1;
    saveUsed(used);

    st.xp += 10;
    if(st.xp % 50 === 0) st.level = (st.level||1)+1;
    saveState(st);

    toast("صح ✅ " + (current.ex||""));
    renderHearts(); renderXp();
    renderQuestion();
  }

  function wrong(){
    used[current.id] = (used[current.id]||0)+1;
    saveUsed(used);

    st.hearts -= 1;
    saveState(st);

    toast("غلط ❌ الإجابة: " + current.ans + " — " + (current.ex||""));
    renderHearts(); renderXp();

    if(st.hearts<=0){
      st.hearts=3;
      saveState(st);
      toast("انتهت القلوب — تم إعادة القلوب ✅");
    }
    renderQuestion();
  }

  elCheck.onclick=()=>{
    if(!current) return;
    if(!selected){ toast("اختر إجابة أولًا"); return; }
    if(selected===current.ans) correct();
    else wrong();
  };
  elSkip.onclick=()=>{
    toast("تم التخطي");
    renderQuestion();
  };
  elReset.onclick=()=>{
    localStorage.removeItem(USED_KEY);
    localStorage.removeItem(STATE_KEY);
    location.reload();
  };

  renderHearts();
  renderXp();
  renderQuestion();
})();
