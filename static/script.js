window.addEventListener("load", function () {

  const chat     = document.getElementById("chat-box");
  const input    = document.getElementById("msg");
  const sendBtn  = document.getElementById("send-btn");
  const clearBtn = document.getElementById("clear-btn");
  const imgBtn   = document.getElementById("img-btn");
  const imgInput = document.getElementById("img-input");
  const imgPreviewWrap = document.getElementById("img-preview-wrap");
  const imgPreview     = document.getElementById("img-preview");
  const imgRemove      = document.getElementById("img-remove");

  let isSending   = false;
  let currentMode = "english";
  let pendingImage = null;

  /* ── Sound Engine ── */
  const AudioCtx = window.AudioContext || window.webkitAudioContext;
  let audioCtx = null;
  function getAudio(){if(!audioCtx)audioCtx=new AudioCtx();return audioCtx;}
  function playTone(freq,type,dur,vol,decay){
    try{const ctx=getAudio(),osc=ctx.createOscillator(),gain=ctx.createGain();
    osc.connect(gain);gain.connect(ctx.destination);osc.type=type||"sine";
    osc.frequency.setValueAtTime(freq,ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(freq*0.5,ctx.currentTime+dur);
    gain.gain.setValueAtTime(vol||0.1,ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001,ctx.currentTime+(decay||dur));
    osc.start();osc.stop(ctx.currentTime+dur+0.05);}catch(e){}
  }
  function playSend(){playTone(440,"sine",0.08,0.09,0.3);setTimeout(()=>playTone(554,"sine",0.08,0.08,0.3),65);setTimeout(()=>playTone(659,"sine",0.1,0.07,0.4),130);}
  function playReceive(){playTone(740,"sine",0.05,0.09,0.8);setTimeout(()=>playTone(932,"sine",0.05,0.07,0.6),90);setTimeout(()=>playTone(587,"sine",0.05,0.05,0.5),180);}
  function playMode(){playTone(370,"triangle",0.1,0.07,0.3);setTimeout(()=>playTone(466,"triangle",0.1,0.06,0.25),80);}
  function playClear(){playTone(294,"sine",0.18,0.06,0.4);setTimeout(()=>playTone(220,"sine",0.15,0.05,0.5),120);}
  function playImgPick(){playTone(523,"sine",0.06,0.07,0.25);}

  /* ── Peacock Canvas ── */
  const canvas = document.getElementById("peacock-canvas");
  const c = canvas.getContext("2d");
  function resize(){canvas.width=window.innerWidth;canvas.height=window.innerHeight;}
  resize(); window.addEventListener("resize",resize);
  const feathers=Array.from({length:6},()=>({
    x:Math.random()*window.innerWidth,y:Math.random()*window.innerHeight,
    size:70+Math.random()*110,angle:Math.random()*Math.PI*2,
    speed:0.0003+Math.random()*0.0004,opacity:0.06+Math.random()*0.1
  }));
  function drawEye(x,y,size,alpha){
    c.save();c.globalAlpha=alpha;
    const g=c.createRadialGradient(x,y,0,x,y,size*0.42);
    g.addColorStop(0,"rgba(255,255,255,0.15)");g.addColorStop(0.5,"rgba(255,255,255,0.06)");g.addColorStop(1,"transparent");
    c.beginPath();c.arc(x,y,size*0.42,0,Math.PI*2);c.fillStyle=g;c.fill();
    for(let i=0;i<16;i++){
      const a=(i/16)*Math.PI*2;
      c.beginPath();c.moveTo(x+Math.cos(a)*size*0.1,y+Math.sin(a)*size*0.1);
      c.quadraticCurveTo(x+Math.cos(a+0.15)*size*0.5,y+Math.sin(a+0.15)*size*0.5,x+Math.cos(a)*size*0.38,y+Math.sin(a)*size*0.38);
      c.strokeStyle="rgba(255,255,255,0.15)";c.lineWidth=0.8;c.stroke();
      c.beginPath();c.ellipse(x+Math.cos(a)*size*0.34,y+Math.sin(a)*size*0.34,size*0.03,size*0.013,a,0,Math.PI*2);
      c.fillStyle="rgba(255,255,255,0.3)";c.fill();
    }
    const eg=c.createRadialGradient(x,y,0,x,y,size*0.08);
    eg.addColorStop(0,"rgba(255,255,255,0.6)");eg.addColorStop(1,"rgba(255,255,255,0.05)");
    c.beginPath();c.arc(x,y,size*0.08,0,Math.PI*2);c.fillStyle=eg;c.fill();
    c.restore();
  }
  (function animC(){
    c.clearRect(0,0,canvas.width,canvas.height);
    const now=Date.now();
    feathers.forEach(f=>{
      f.angle+=f.speed;
      drawEye(f.x+Math.sin(f.angle*0.7)*25,f.y+Math.cos(f.angle*0.5)*16,f.size,f.opacity*(0.7+0.3*Math.sin(now*0.001+f.angle)));
    });
    requestAnimationFrame(animC);
  })();

  /* ── Petals ── */
  const petalWrap=document.getElementById("petals");
  const petalList=["🌸","🌺","🌼","✿","❀","🍀","🪷"];
  function spawnPetal(){
    const el=document.createElement("div");el.className="petal";
    el.textContent=petalList[Math.floor(Math.random()*petalList.length)];
    el.style.left=(Math.random()*100)+"%";
    el.style.fontSize=(9+Math.random()*8)+"px";
    el.style.animationDuration=(10+Math.random()*12)+"s";
    el.style.animationDelay=(Math.random()*3)+"s";
    petalWrap.appendChild(el);setTimeout(()=>el.remove(),25000);
  }
  for(let i=0;i<4;i++)setTimeout(spawnPetal,i*1200);
  setInterval(spawnPetal,4000);

  /* ── Toast ── */
  const toast=document.createElement("div");toast.className="toast";document.body.appendChild(toast);
  let toastTimer;
  function showToast(msg){toast.textContent=msg;toast.classList.add("show");clearTimeout(toastTimer);toastTimer=setTimeout(()=>toast.classList.remove("show"),2400);}

  /* ── Mode Switcher ── */
  document.querySelectorAll(".mode-btn").forEach(btn=>{
    btn.addEventListener("click",()=>{
      document.querySelectorAll(".mode-btn").forEach(b=>b.classList.remove("active"));
      btn.classList.add("active");currentMode=btn.dataset.mode;playMode();
      const labels={english:"🇬🇧 English mode",hindi:"🇮🇳 Hindi mode shuru",hinglish:"✨ Hinglish on hai!",sanskrit:"🕉️ Sanskrit mode"};
      showToast(labels[currentMode]);
      addMessage("bot",labels[currentMode]+" 🙏",false,null,false);
    });
  });

  /* ── Image Upload ── */
  imgBtn.addEventListener("click",()=>imgInput.click());
  imgInput.addEventListener("change",()=>{
    const file=imgInput.files[0];if(!file)return;
    if(!file.type.startsWith("image/")){showToast("⚠️ Please select an image");return;}
    if(file.size>10*1024*1024){showToast("⚠️ Image too large (max 10MB)");return;}
    const reader=new FileReader();
    reader.onload=e=>{pendingImage=e.target.result;imgPreview.src=pendingImage;imgPreviewWrap.classList.add("visible");imgBtn.classList.add("has-image");playImgPick();showToast("📷 Image selected");};
    reader.readAsDataURL(file);imgInput.value="";
  });
  imgRemove.addEventListener("click",()=>{clearImage();showToast("Image removed");});
  function clearImage(){pendingImage=null;imgPreview.src="";imgPreviewWrap.classList.remove("visible");imgBtn.classList.remove("has-image");}

  /* ── Typewriter Effect ── */
  function typewriter(el, text, speed, onDone){
    let i=0; el.innerHTML="";
    const cursor=document.createElement("span");cursor.className="typewriter-cursor";
    el.appendChild(cursor);
    function tick(){
      if(i<text.length){
        const ch=text[i];
        if(ch==="\n"){cursor.before(document.createElement("br"));}
        else{cursor.before(document.createTextNode(ch));}
        i++;
        const delay=ch==="."||ch==="!"||ch==="?"?110:ch===","?70:ch==="\n"?160:speed;
        setTimeout(tick,delay);
        // Scroll as text appears
        requestAnimationFrame(()=>chat.scrollTo({top:chat.scrollHeight,behavior:"smooth"}));
      } else {
        cursor.remove();
        // Replace with formatted HTML after typing done
        el.innerHTML=formatText(text.replace(/\n/g,"<br>"));
        if(onDone)onDone();
      }
    }
    tick();
  }

  /* ── Helpers ── */
  function scrollBottom(){requestAnimationFrame(()=>chat.scrollTo({top:chat.scrollHeight,behavior:"smooth"}));}

  function formatText(text){
    return text
      .replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;")
      .replace(/\*\*(.*?)\*\*/g,"<strong>$1</strong>")
      .replace(/\*(.*?)\*/g,"<em>$1</em>")
      .replace(/`(.*?)`/g,"<code>$1</code>");
  }

  function mkAvatar(type){
    const d=document.createElement("div");d.className="avatar";
    if(type==="bot"){
      d.style.cssText="width:34px;height:34px;border-radius:50%;background:#000;border:1px solid rgba(255,255,255,0.2);display:flex;align-items:center;justify-content:center;font-size:18px;color:#fff;text-shadow:0 0 10px rgba(255,255,255,0.8);flex-shrink:0;";
      d.textContent="ॐ";
    } else {
      d.style.cssText="width:34px;height:34px;border-radius:50%;background:#111;border:1px solid rgba(255,255,255,0.12);display:flex;align-items:center;justify-content:center;font-size:15px;flex-shrink:0;";
      d.textContent="👤";
    }
    return d;
  }

  function addMessage(type,text,shimmer,imageDataURL,useTypewriter){
    if(!text&&!imageDataURL)return;
    if(!text)text="";
    const w=document.createElement("div");
    w.className="msg "+type+(shimmer?" new-msg":"");
    const b=document.createElement("div");b.className="bubble";
    if(imageDataURL){const img=document.createElement("img");img.className="bubble-img";img.src=imageDataURL;b.appendChild(img);}
    const span=document.createElement("span");
    if(type==="user"||!useTypewriter){
      if(text)span.innerHTML=formatText(text.replace(/\n/g,"<br>"));
      b.appendChild(span);
      if(type==="user"){w.appendChild(b);w.appendChild(mkAvatar("user"));}
      else{w.appendChild(mkAvatar("bot"));w.appendChild(b);}
      chat.appendChild(w);scrollBottom();
    } else {
      // Bot with typewriter
      b.appendChild(span);
      w.appendChild(mkAvatar("bot"));w.appendChild(b);
      chat.appendChild(w);scrollBottom();
      typewriter(span,text,20,()=>scrollBottom());
    }
    if(shimmer)setTimeout(()=>w.classList.remove("new-msg"),2000);
    return w;
  }

  function mkTyping(){
    const w=document.createElement("div");w.className="msg bot";
    const b=document.createElement("div");b.className="bubble";
    b.innerHTML='<div class="typing-dots"><span></span><span></span><span></span></div>';
    w.appendChild(mkAvatar("bot"));w.appendChild(b);
    chat.appendChild(w);scrollBottom();return w;
  }

  function setInput(disabled){
    input.disabled=disabled;
    sendBtn.style.opacity=disabled?"0.45":"1";
    sendBtn.style.pointerEvents=disabled?"none":"auto";
  }

  /* ── Send ── */
  async function sendMsg(){
    if(isSending)return;
    const msg=input.value.trim(),hasImage=!!pendingImage;
    if(!msg&&!hasImage){sendBtn.classList.add("shake");setTimeout(()=>sendBtn.classList.remove("shake"),420);return;}
    sendBtn.classList.add("rippling");setTimeout(()=>sendBtn.classList.remove("rippling"),460);
    playSend();isSending=true;
    addMessage("user",msg,false,hasImage?pendingImage:null,false);
    const sentImage=pendingImage,sentMsg=msg;
    input.value="";clearImage();setInput(true);
    const typing=mkTyping();
    try{
      const ctrl=new AbortController();
      const t=setTimeout(()=>ctrl.abort(),30000);
      let res;
      if(sentImage){
        const formData=new FormData();
        if(sentMsg)formData.append("msg",sentMsg);
        formData.append("mode",currentMode);
        const base64=sentImage.split(",")[1],mime=sentImage.split(";")[0].split(":")[1];
        const bytes=atob(base64),arr=new Uint8Array(bytes.length);
        for(let i=0;i<bytes.length;i++)arr[i]=bytes.charCodeAt(i);
        formData.append("image",new Blob([arr],{type:mime}),"image.jpg");
        res=await fetch("/ask",{method:"POST",body:formData,signal:ctrl.signal});
      } else {
        res=await fetch("/ask?msg="+encodeURIComponent(sentMsg)+"&mode="+currentMode,{method:"GET",signal:ctrl.signal});
      }
      clearTimeout(t);
      if(!res.ok)throw new Error("HTTP "+res.status);
      const data=await res.json();typing.remove();
      const reply=data&&data.reply;
      if(!reply)addMessage("bot","⚠️ Empty response. Please try again.",false,null,false);
      else{playReceive();addMessage("bot",reply,true,null,true);}
    }catch(err){
      typing.remove();
      if(err.name==="AbortError")addMessage("bot","⏱️ The divine takes time. Please try again.",false,null,false);
      else if(!navigator.onLine)addMessage("bot","📡 You are offline.",false,null,false);
      else addMessage("bot","🌐 Something went wrong. Please try again.",false,null,false);
      console.error("[Vasudev AI]",err);
    }
    isSending=false;setInput(false);input.focus();
  }

  /* ── Clear ── */
  clearBtn.addEventListener("click",async()=>{
    playClear();
    const kids=[...chat.children];
    kids.forEach((el,i)=>setTimeout(()=>{el.style.transition="opacity 0.28s,transform 0.28s";el.style.opacity="0";el.style.transform="translateY(-8px) scale(0.97)";},i*45));
    setTimeout(async()=>{
      chat.innerHTML="";
      try{await fetch("/clear");}catch(e){}
      showToast("🙏 Memory cleared");
      addMessage("bot","Memory cleared 🙏 Like the Ganga at dawn — **fresh**, pure, and ready.",true,null,true);
    },kids.length*45+360);
  });

  /* ── Drag & Drop ── */
  document.addEventListener("dragover",e=>e.preventDefault());
  document.addEventListener("drop",e=>{
    e.preventDefault();const file=e.dataTransfer.files[0];
    if(file&&file.type.startsWith("image/")){
      const reader=new FileReader();
      reader.onload=ev=>{pendingImage=ev.target.result;imgPreview.src=pendingImage;imgPreviewWrap.classList.add("visible");imgBtn.classList.add("has-image");playImgPick();showToast("📷 Image dropped — ready to send");};
      reader.readAsDataURL(file);
    }
  });

  sendBtn.addEventListener("click",sendMsg);
  input.addEventListener("keydown",e=>{if(e.key==="Enter"&&!e.shiftKey){e.preventDefault();sendMsg();}});
  input.addEventListener("focus",()=>setTimeout(scrollBottom,350));

  /* ── Welcome with typewriter ── */
  setTimeout(()=>{
    playReceive();
    addMessage("bot","Namaste 🙏 I am **Vasudev AI** — your divine guide.\n\nAsk me anything — wisdom, knowledge, or guidance awaits.\nYou can also attach an **image** 📷 using the button below.\nSwitch language anytime above. I remember our full conversation 🕉️",true,null,true);
  },900);

});
