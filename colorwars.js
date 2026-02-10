// colorwars.js — Chain Reaction بسيط (Offline)
(function(){
  const SIZE = 6;
  const boardEl = document.getElementById("board");
  const modeEl = document.getElementById("mode");
  const btnNew = document.getElementById("btnNew");
  const turnChip = document.getElementById("turnChip");

  let players = 2;
  let turn = 1;            // 1..players
  let started = new Set(); // اللاعبين الذين لعبوا على الأقل مرة
  let grid = [];           // [{owner,count}]
  let busy = false;

  function cap(r,c){
    const corner = (r===0||r===SIZE-1) && (c===0||c===SIZE-1);
    const edge = (r===0||r===SIZE-1||c===0||c===SIZE-1);
    if(corner) return 2;
    if(edge) return 3;
    return 4;
  }

  function colorName(p){
    return p===1 ? "أحمر" : p===2 ? "أزرق" : p===3 ? "أخضر" : "أصفر";
  }

  function setTurnChip(){
    turnChip.textContent = "الدور: اللاعب " + turn + " (" + colorName(turn) + ")";
  }

  function init(){
    players = +modeEl.value;
    turn = 1;
    started = new Set();
    busy = false;
    grid = Array.from({length: SIZE*SIZE}, ()=>({owner:0,count:0}));
    render();
    setTurnChip();
  }

  function idx(r,c){ return r*SIZE + c; }

  function render(){
    boardEl.innerHTML="";
    for(let r=0;r<SIZE;r++){
      for(let c=0;c<SIZE;c++){
        const i = idx(r,c);
        const cell = document.createElement("div");
        const st = grid[i];
        cell.className = "cell owner"+st.owner;
        cell.title = "سعة: " + cap(r,c);
        const dots = document.createElement("div");
        dots.className="dots";
        for(let k=0;k<st.count;k++){
          const d=document.createElement("span");
          d.className="dot";
          dots.appendChild(d);
        }
        cell.appendChild(dots);
        cell.onclick = ()=>onClick(r,c);
        boardEl.appendChild(cell);
      }
    }
  }

  function nextTurn(){
    // انتقل للاعب التالي الذي ما زال موجودًا (بعد أن يبدأ الجميع)
    let t = turn;
    for(let step=0; step<players; step++){
      t = (t % players) + 1;
      if(isPlayerAlive(t) || started.size < players) { turn = t; break; }
    }
    setTurnChip();
  }

  function isPlayerAlive(p){
    return grid.some(x=>x.owner===p);
  }

  function checkWin(){
    if(started.size < players) return null; // لسه بدري
    const alive = [];
    for(let p=1;p<=players;p++) if(isPlayerAlive(p)) alive.push(p);
    if(alive.length===1) return alive[0];
    return null;
  }

  function neighbors(r,c){
    const nb=[];
    if(r>0) nb.push([r-1,c]);
    if(r<SIZE-1) nb.push([r+1,c]);
    if(c>0) nb.push([r,c-1]);
    if(c<SIZE-1) nb.push([r,c+1]);
    return nb;
  }

  function onClick(r,c){
    if(busy) return;
    const i = idx(r,c);
    const st = grid[i];
    if(st.owner!==0 && st.owner!==turn){
      return; // ممنوع
    }
    started.add(turn);
    busy = true;
    addOrb(r,c,turn).then(()=>{
      render();
      const w = checkWin();
      if(w){
        turnChip.textContent = "فوز اللاعب " + w + " ("+colorName(w)+") 🎉";
      }else{
        nextTurn();
      }
      busy=false;
    });
  }

  async function addOrb(r,c,owner){
    const q = [[r,c,owner]];
    while(q.length){
      const [rr,cc,ow] = q.shift();
      const i = idx(rr,cc);
      grid[i].owner = ow;
      grid[i].count += 1;

      const capacity = cap(rr,cc);
      if(grid[i].count >= capacity){
        // انفجار
        grid[i].count = 0;
        grid[i].owner = 0;
        const nb = neighbors(rr,cc);
        for(const [nr,nc] of nb){
          q.push([nr,nc,ow]);
        }
        // إيقاع بسيط للانفجار
        await new Promise(res=>setTimeout(res, 35));
        render();
      }
    }
  }

  btnNew.onclick = init;
  modeEl.onchange = init;

  init();
})();
