// xo.js — XO (لاعبين/كمبيوتر) Offline
(function(){
  const gridEl = document.getElementById("grid");
  const modeEl = document.getElementById("mode");
  const lvlEl  = document.getElementById("lvl");
  const btnNew = document.getElementById("btnNew");
  const btnResetScore = document.getElementById("btnResetScore");
  const turnChip = document.getElementById("turnChip");
  const scoreChip = document.getElementById("scoreChip");
  const msgEl = document.getElementById("msg");

  const STORE="karim_xo_v2";
  let board = Array(9).fill(null); // "X" | "O"
  let turn = "X";
  let locked = false;
  let score = {X:0, O:0};

  function save(){
    try{
      localStorage.setItem(STORE, JSON.stringify({
        mode: modeEl.value,
        lvl: lvlEl.value,
        score
      }));
    }catch{}
  }
  function load(){
    try{
      const raw=localStorage.getItem(STORE);
      if(!raw) return;
      const o=JSON.parse(raw);
      if(o.mode) modeEl.value=o.mode;
      if(o.lvl) lvlEl.value=o.lvl;
      if(o.score) score=o.score;
    }catch{}
  }

  function setChips(){
    turnChip.textContent = "الدور: " + (turn==="X" ? "X" : "O");
    scoreChip.textContent = "X: " + score.X + " — O: " + score.O;
  }

  function lines(){
    return [
      [0,1,2],[3,4,5],[6,7,8],
      [0,3,6],[1,4,7],[2,5,8],
      [0,4,8],[2,4,6]
    ];
  }
  function winner(b){
    for(const [a,c,d] of lines()){
      if(b[a] && b[a]===b[c] && b[a]===b[d]) return b[a];
    }
    if(b.every(x=>x)) return "D"; // تعادل
    return null;
  }

  function render(){
    gridEl.innerHTML="";
    for(let i=0;i<9;i++){
      const v=board[i];
      const d=document.createElement("div");
      d.className="cell"+(v?" lock":"")+(v==="X"?" x":v==="O"?" o":"");
      d.textContent = v ? v : "";
      d.onclick = ()=>onCell(i);
      gridEl.appendChild(d);
    }
    setChips();
  }

  function endRound(w){
    locked=true;
    if(w==="X"){ score.X++; msgEl.textContent="فوز X ✅"; }
    else if(w==="O"){ score.O++; msgEl.textContent="فوز O ✅"; }
    else { msgEl.textContent="تعادل 🤝"; }
    setChips();
    save();
  }

  function newRound(){
    board = Array(9).fill(null);
    turn = "X";
    locked=false;
    msgEl.textContent="";
    render();
    if(modeEl.value==="ai" && turn==="O"){
      setTimeout(aiMove, 180);
    }
  }

  function onCell(i){
    if(locked) return;
    if(board[i]) return;

    board[i]=turn;
    const w = winner(board);
    render();

    if(w){ endRound(w); return; }

    turn = (turn==="X") ? "O" : "X";
    setChips();

    if(modeEl.value==="ai" && turn==="O"){
      locked=true;
      setTimeout(()=>{
        aiMove();
        locked=false;
      }, 160);
    }
  }

  // ===== AI =====
  function emptyCells(b){
    const out=[];
    for(let i=0;i<9;i++) if(!b[i]) out.push(i);
    return out;
  }

  function scoreBoard(b, depth){
    const w=winner(b);
    if(w==="O") return 10 - depth;
    if(w==="X") return depth - 10;
    if(w==="D") return 0;
    return null;
  }

  function minimax(b, depth, isMax, alpha, beta){
    const s = scoreBoard(b, depth);
    if(s!==null) return {score:s, move:null};

    const moves = emptyCells(b);
    let bestMove = null;

    if(isMax){
      let best = -999;
      for(const m of moves){
        b[m]="O";
        const r=minimax(b, depth+1, false, alpha, beta);
        b[m]=null;
        if(r.score>best){ best=r.score; bestMove=m; }
        alpha = Math.max(alpha, best);
        if(beta<=alpha) break;
      }
      return {score:best, move:bestMove};
    }else{
      let best = 999;
      for(const m of moves){
        b[m]="X";
        const r=minimax(b, depth+1, true, alpha, beta);
        b[m]=null;
        if(r.score<best){ best=r.score; bestMove=m; }
        beta = Math.min(beta, best);
        if(beta<=alpha) break;
      }
      return {score:best, move:bestMove};
    }
  }

  function pickEasy(){
    // عشوائي لكن ذكي: لو فيه فوز مباشر خده، لو فيه منع خده، وإلا عشوائي
    const moves=emptyCells(board);
    // فوز مباشر لـ O
    for(const m of moves){
      board[m]="O"; if(winner(board)==="O"){ board[m]=null; return m; } board[m]=null;
    }
    // منع X
    for(const m of moves){
      board[m]="X"; if(winner(board)==="X"){ board[m]=null; return m; } board[m]=null;
    }
    return moves[Math.floor(Math.random()*moves.length)];
  }

  function aiMove(){
    if(winner(board)) return;

    let move=null;
    const lvl=lvlEl.value;

    if(lvl==="easy"){
      move = pickEasy();
    }else if(lvl==="medium"){
      // 50% minimax و 50% سهل
      move = (Math.random()<0.5) ? minimax(board.slice(),0,true,-999,999).move : pickEasy();
    }else{
      move = minimax(board.slice(),0,true,-999,999).move;
    }

    if(move===null || board[move]) return;
    board[move]="O";
    const w=winner(board);
    render();
    if(w){ endRound(w); return; }
    turn="X";
    setChips();
  }

  // ===== Bind =====
  btnNew.onclick = newRound;
  btnResetScore.onclick = ()=>{
    score={X:0,O:0};
    save();
    setChips();
    msgEl.textContent="تم تصفير النتيجة.";
  };
  modeEl.onchange = ()=>{ save(); newRound(); };
  lvlEl.onchange = ()=>{ save(); };

  load();
  render();
  setChips();
})();
