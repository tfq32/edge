import { useState } from "react";

const C = {
  bg:'#f0f5ff', white:'#ffffff',
  blue:'#42aaf5', blueL:'#2196e8', blueLL:'#a8d8f8',
  blueSoft:'rgba(66,170,245,0.08)', blueBorder:'rgba(66,170,245,0.18)',
  text:'#1a1c3a', textSub:'#5b6080', textHint:'#9ca3af',
  green:'#10b981', amber:'#f59e0b', red:'#ef4444',
  shadow:'rgba(66,170,245,0.10)',
};

const SCREENS = [
  {id:"init",label:"① 初始页",en:"Init"},
  {id:"scan",label:"② 扫码",en:"QR Scan"},
  {id:"error",label:"③ 失败",en:"Error"},
  {id:"wifi",label:"④ WiFi引导",en:"WiFi"},
  {id:"loading",label:"⑤ 连接中",en:"Loading"},
  {id:"desktop",label:"⑥ 桌面",en:"Desktop"},
];

const CSS=`
@import url('https://fonts.googleapis.com/css2?family=Noto+Sans+SC:wght@400;500;700;900&display=swap');
*{box-sizing:border-box;margin:0;padding:0;}body{background:#dde5ff;}
@keyframes scanLine{0%{top:0}100%{top:calc(100% - 2px)}}
@keyframes blink{0%,100%{opacity:1}50%{opacity:.2}}
@keyframes spinCW{to{transform:rotate(360deg)}}
@keyframes wifiRing{0%{transform:scale(1);opacity:.5}100%{transform:scale(2.8);opacity:0}}
@keyframes floatY{0%,100%{transform:translateY(0)}50%{transform:translateY(-3px)}}
@keyframes shakeLoop{0%,60%,100%{transform:translateX(0)}62%{transform:translateX(-4px)}66%{transform:translateX(4px)}70%{transform:translateX(-4px)}74%{transform:translateX(4px)}78%{transform:translateX(-4px)}82%{transform:translateX(0)}}
@keyframes breathe{0%,100%{transform:scale(1)}50%{transform:scale(1.025)}}
`;

function AppIcon({size=48}){
  const id=`g${size}`;
  return <svg width={size} height={size} viewBox="0 0 192 192" fill="none">
    <defs><linearGradient id={id} x1="61.2" y1="39.9" x2="134.3" y2="154.7" gradientUnits="userSpaceOnUse">
      <stop offset="0" stopColor="#26F0A4"/><stop offset=".25" stopColor="#02BFFF"/>
      <stop offset=".76" stopColor="#313AFC"/><stop offset="1" stopColor="#7903E8"/>
    </linearGradient></defs>
    <path fillRule="evenodd" clipRule="evenodd" d="M153.429 94.4229H127.01C130.088 90.4232 132.353 85.7331 133.537 80.7513C133.971 78.9364 134.254 77.086 134.423 75.2214C134.566 73.3532 134.585 71.4743 134.473 69.5954C134.34 67.7166 134.057 65.8484 133.659 64.0015C133.25 62.1547 132.686 60.3398 132.015 58.5606C131.341 56.7814 130.483 55.0733 129.543 53.4115C128.592 51.7532 127.498 50.1804 126.321 48.6716C125.123 47.177 123.824 45.7643 122.421 44.4512C121 43.1595 119.507 41.9354 117.914 40.843C116.314 39.7647 114.649 38.7648 112.902 37.9214C111.154 37.0816 109.353 36.345 107.495 35.7721C105.636 35.2099 103.742 34.7473 101.818 34.4555C99.895 34.1744 97.9505 34.0214 96.0055 34C94.0572 34.0142 92.1161 34.1566 90.1857 34.427C88.2589 34.7117 86.3608 35.1636 84.4986 35.7187C80.7778 36.8575 77.2435 38.5798 74.0394 40.7576C72.4392 41.85 70.9429 43.0777 69.5184 44.373C68.1155 45.6896 66.8095 47.1058 65.6074 48.604C64.427 50.1199 63.3254 51.6928 62.3746 53.3545C61.4346 55.0199 60.5734 56.7315 59.8988 58.5179C59.2279 60.3007 58.6645 62.1226 58.2555 63.973C57.8572 65.827 57.5737 67.6988 57.4446 69.5812C57.3369 71.4672 57.3585 73.3496 57.5056 75.2214C57.6779 77.0896 57.9648 78.9435 58.4062 80.7619C59.6046 85.7473 61.8866 90.4339 64.9831 94.4193H38.5786C36.8778 94.4193 35.5 95.7858 35.5 97.4723C35.5 99.1591 36.8778 100.526 38.5786 100.526H71.2299C72.9307 100.526 74.3085 99.1591 74.3085 97.4723C74.3157 96.7467 74.1112 96.1096 73.6734 95.5865C72.6364 94.3375 71.7035 93.1098 70.8676 91.8252C69.9741 90.3591L68.6717 87.829C68.0473 86.4519 67.5127 85.0428 67.0821 83.6087C66.6624 82.1711 66.3286 80.7156 66.117 79.2425C65.9232 77.7693 65.7797 74.8157C65.7869 73.3389 65.8909 71.8693 66.0918 70.4174C66.2999 68.9656 66.6085 67.5351 67.0068 66.133C67.4122 64.7345 67.9397 63.3752 68.5353 62.055C69.1417 60.7384 69.8414 59.4716 70.6128 58.251C71.3914 57.034 72.2777 55.8953 73.2142 54.7993C74.1686 53.7175 75.2091 52.714 76.2855 51.7568C77.3871 50.8316 78.5281 49.9562 79.7408 49.1911C84.5704 46.0988 90.2754 44.469 96.0055 44.4548C101.732 44.4263 107.466 46.0277 112.324 49.1093C113.54 49.8779 114.689 50.7533 115.794 51.682C116.877 52.6393 117.918 53.6499 118.876 54.7352C119.816 55.8348 120.709 56.9771 121.488 58.1976C122.263 59.4218 122.966 60.6921 123.569 62.0159C124.165 63.3432 124.689 64.7061 125.094 66.1117C125.492 67.5173 125.797 68.9549 126.006 70.4103C126.203 71.8657 126.303 73.3425 126.307 74.8228C126.292 76.3032 126.16 77.7835 125.955 79.2567C125.736 80.7299 125.395 82.1889 124.972 83.6265C124.534 85.0606 123.992 86.4697 123.361 87.8433L122.862 88.8646C122.528 89.4841C122.044 90.3662L121.14 91.8288C120.297 93.1063 119.364 94.3304 118.356 95.5118C117.717 96.2555 117.523 97.1949 117.753 98.0559C118.029 99.4615 119.274 100.522 120.774 100.522H153.422C155.122 100.522 156.5 99.1559 156.5 97.4692C156.5 95.7823 155.122 94.4158 153.422 94.4158L153.429 94.4229Z" fill={`url(#${id})`}/>
  </svg>;
}

function BlobBg({danger=false}){
  const a=danger?'rgba(239,68,68,':'rgba(66,170,245,';
  return <div style={{position:"absolute",inset:0,overflow:"hidden",pointerEvents:"none"}}>
    <div style={{position:"absolute",bottom:"-18%",left:"-18%",width:"90%",paddingBottom:"90%",borderRadius:"50%",
      background:`radial-gradient(circle,${a}0.18) 0%,${a}0.06) 60%,transparent 100%)`}}/>
    <div style={{position:"absolute",bottom:"-22%",right:"-22%",width:"80%",paddingBottom:"80%",borderRadius:"50%",
      background:`radial-gradient(circle,${a}0.22) 0%,${a}0.08) 55%,transparent 100%)`}}/>
  </div>;
}

function TopBar({title,showBack=true}){
  return <div style={{display:"flex",alignItems:"center",justifyContent:"space-between",
    padding:"10px 16px",height:52,flexShrink:0,position:"relative",zIndex:10}}>
    {showBack
      ?<div style={{width:36,height:36,borderRadius:18,background:C.white,
          border:`1px solid ${C.blueBorder}`,display:"flex",alignItems:"center",justifyContent:"center",
          boxShadow:"0 2px 8px rgba(66,170,245,0.10)",cursor:"pointer"}}>
          <span style={{fontSize:22,color:C.text,lineHeight:"28px",marginTop:"-2px"}}>‹</span>
        </div>
      :<div style={{width:36}}/>}
    <span style={{fontSize:14,fontWeight:700,color:C.text}}>{title}</span>
    <div style={{width:36}}/>
  </div>;
}

function Phone({children,label,en}){
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
    <div style={{width:280,height:590,background:C.bg,borderRadius:44,
      border:"1.5px solid rgba(66,170,245,0.12)",
      boxShadow:"0 0 0 1.5px white,0 24px 64px rgba(66,170,245,0.15),0 4px 16px rgba(0,0,0,0.06)",
      position:"relative",overflow:"hidden",fontFamily:"'Noto Sans SC',sans-serif"}}>
      <div style={{position:"absolute",top:8,left:"50%",transform:"translateX(-50%)",
        width:80,height:20,background:"rgba(240,245,255,0.9)",borderRadius:10,zIndex:20,
        display:"flex",alignItems:"center",justifyContent:"center",gap:4,
        border:"1px solid rgba(66,170,245,0.08)"}}>
        <div style={{width:5,height:5,borderRadius:"50%",background:C.blueL,opacity:.5}}/>
        <div style={{width:28,height:3,borderRadius:2,background:"rgba(66,170,245,0.12)"}}/>
      </div>
      <div style={{position:"absolute",top:0,left:0,right:0,height:44,zIndex:15,
        display:"flex",alignItems:"flex-end",justifyContent:"space-between",
        padding:"0 18px 5px",fontSize:10,color:C.textSub}}>
        <span>09:41</span>
        <div style={{display:"flex",gap:4,alignItems:"center"}}>
          <svg width="13" height="10" viewBox="0 0 13 10">
            {[0,3,6,9].map((x,i)=><rect key={x} x={x} y={9-3-i*1.8} width="2.5" height={3+i*1.8} rx=".8" fill={i<3?C.blue:"rgba(66,170,245,0.2)"}/>)}
          </svg>
          <svg width="15" height="11" viewBox="0 0 15 11">
            <rect x="1" y="2" width="11" height="8" rx="2" fill="none" stroke={C.blueL} strokeWidth="1.2" opacity=".5"/>
            <rect x="12" y="4.5" width="2" height="3" rx=".8" fill={C.blueL} opacity=".5"/>
            <rect x="2.5" y="3.5" width="7" height="5" rx="1" fill={C.blueL} opacity=".5"/>
          </svg>
        </div>
      </div>
      <div style={{position:"absolute",inset:0,paddingTop:44}}>{children}</div>
    </div>
    <div style={{textAlign:"center"}}>
      <div style={{color:C.text,fontSize:12,fontWeight:700}}>{label}</div>
      <div style={{color:C.textHint,fontSize:10,marginTop:2}}>{en}</div>
    </div>
  </div>;
}

function Pad({children,label,en}){
  return <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
    <div style={{width:440,height:590,background:C.bg,borderRadius:28,
      border:"1.5px solid rgba(66,170,245,0.12)",
      boxShadow:"0 0 0 1.5px white,0 20px 60px rgba(66,170,245,0.12),0 4px 16px rgba(0,0,0,0.05)",
      position:"relative",overflow:"hidden",fontFamily:"'Noto Sans SC',sans-serif"}}>
      <div style={{position:"absolute",bottom:8,left:"50%",transform:"translateX(-50%)",
        width:120,height:4,background:"rgba(66,170,245,0.12)",borderRadius:2,zIndex:20}}/>
      <div style={{position:"absolute",top:0,left:0,right:0,height:36,zIndex:15,
        display:"flex",alignItems:"flex-end",justifyContent:"space-between",
        padding:"0 24px 5px",fontSize:11,color:C.textSub}}>
        <span>09:41</span>
        <div style={{display:"flex",gap:5,alignItems:"center"}}>
          <svg width="15" height="10" viewBox="0 0 13 10">
            {[0,3,6,9].map((x,i)=><rect key={x} x={x} y={9-3-i*1.8} width="2.5" height={3+i*1.8} rx=".8" fill={i<3?C.blue:"rgba(66,170,245,0.2)"}/>)}
          </svg>
          <svg width="18" height="11" viewBox="0 0 15 11">
            <rect x="1" y="2" width="11" height="8" rx="2" fill="none" stroke={C.blueL} strokeWidth="1.2" opacity=".5"/>
            <rect x="12" y="4.5" width="2" height="3" rx=".8" fill={C.blueL} opacity=".5"/>
            <rect x="2.5" y="3.5" width="7" height="5" rx="1" fill={C.blueL} opacity=".5"/>
          </svg>
        </div>
      </div>
      <div style={{position:"absolute",inset:0,paddingTop:36}}>{children}</div>
    </div>
    <div style={{textAlign:"center"}}>
      <div style={{color:C.text,fontSize:12,fontWeight:700}}>{label} · iPad</div>
      <div style={{color:C.textHint,fontSize:10,marginTop:2}}>{en}</div>
    </div>
  </div>;
}

/* ① Init */
function InitScreen(){
  return <div style={{height:"100%",position:"relative",overflow:"hidden",
    background:"linear-gradient(180deg,#f8faff 0%,#f0f5ff 100%)",
    display:"flex",flexDirection:"column"}}>
    <BlobBg/>
    <div style={{height:16}}/>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:32,zIndex:1}}>
      <div style={{width:80,height:80,borderRadius:22,background:C.white,
        boxShadow:"0 8px 28px rgba(66,170,245,0.16)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:20}}>
        <AppIcon size={56}/>
      </div>
      <div style={{fontSize:26,fontWeight:900,color:C.text,letterSpacing:-.5}}>微应用桌面</div>
      <div style={{fontSize:12,color:C.textSub,marginTop:6,letterSpacing:1}}>点亮智慧连接</div>
    </div>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>
      <div style={{textAlign:"center",padding:"0 28px"}}>
        <div style={{fontSize:13,color:C.textSub,lineHeight:1.9}}>扫描企业二维码，即刻接入</div>
        <div style={{fontSize:13,color:C.textSub,lineHeight:1.9}}>内网微应用服务平台</div>
      </div>
    </div>
    <div style={{padding:"0 24px 40px",zIndex:1}}>
      <div style={{height:54,borderRadius:27,background:C.blue,display:"flex",alignItems:"center",
        justifyContent:"center",gap:10,cursor:"pointer",
        boxShadow:"0 8px 24px rgba(66,170,245,0.35)",animation:"breathe 2s ease-in-out infinite"}}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
          <path d="M3 9V5a2 2 0 0 1 2-2h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M21 9V5a2 2 0 0 0-2-2h-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 15v4a2 2 0 0 0 2 2h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M21 15v4a2 2 0 0 1-2 2h-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="white" strokeWidth="1.5" fill="none"/>
        </svg>
        <span style={{fontSize:16,fontWeight:700,color:"white",letterSpacing:.5}}>扫码连接</span>
      </div>
      <div style={{marginTop:14,height:46,borderRadius:23,background:"rgba(66,170,245,0.06)",
        border:`1px solid ${C.blueBorder}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <span style={{fontSize:14,color:C.blueL,fontWeight:600}}>从历史记录连接</span>
      </div>
    </div>
  </div>;
}

/* ② Scan */
function ScanScreen(){
  return <div style={{height:"100%",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",
    background:"linear-gradient(180deg,#f8faff 0%,#f0f5ff 100%)"}}>
    <BlobBg/>
    <TopBar title="扫码连接"/>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",padding:"4px 0 0",zIndex:1}}>
      <div style={{fontSize:13,color:C.textSub,marginBottom:16}}>将二维码放入框内，自动识别</div>
      <div style={{width:190,height:190,position:"relative"}}>
        <div style={{position:"absolute",inset:0,background:"rgba(66,170,245,0.03)",borderRadius:12}}/>
        {[{top:-1,left:-1,borderTop:`2.5px solid ${C.blue}`,borderLeft:`2.5px solid ${C.blue}`,borderRadius:"6px 0 0 0"},
          {top:-1,right:-1,borderTop:`2.5px solid ${C.blue}`,borderRight:`2.5px solid ${C.blue}`,borderRadius:"0 6px 0 0"},
          {bottom:-1,left:-1,borderBottom:`2.5px solid ${C.blue}`,borderLeft:`2.5px solid ${C.blue}`,borderRadius:"0 0 0 6px"},
          {bottom:-1,right:-1,borderBottom:`2.5px solid ${C.blue}`,borderRight:`2.5px solid ${C.blue}`,borderRadius:"0 0 6px 0"},
        ].map((s,i)=><div key={i} style={{position:"absolute",width:20,height:20,...s,zIndex:4}}/>)}
        <div style={{position:"absolute",left:"5%",width:"90%",height:2,
          background:`linear-gradient(90deg,transparent,${C.blue},white,${C.blue},transparent)`,
          animation:"scanLine 2s ease-in-out infinite alternate",top:0,zIndex:3}}/>
      </div>
      <div style={{marginTop:10,fontSize:11,color:C.textHint}}>请向管理员获取二维码</div>
    </div>
    <div style={{margin:"auto 16px 20px",background:C.white,borderRadius:14,
      boxShadow:`0 4px 16px ${C.shadow}`,padding:"14px 16px",
      display:"flex",alignItems:"center",justifyContent:"space-between",position:"relative",zIndex:1}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:42,height:42,borderRadius:10,background:C.blueSoft,
          border:`1px solid ${C.blueBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="22" height="20" viewBox="0 0 24 22" fill="none">
            <rect x="2" y="2" width="20" height="13" rx="2" stroke={C.blueL} strokeWidth="1.6" fill="none"/>
            <path d="M8 19h8M12 15v4" stroke={C.blueL} strokeWidth="1.6" strokeLinecap="round"/>
            <path d="M6 7h4M6 10h3" stroke={C.blueL} strokeWidth="1.3" strokeLinecap="round" opacity=".5"/>
            <rect x="14" y="6" width="4" height="4" rx=".5" stroke={C.blueL} strokeWidth="1.3" fill="none" opacity=".5"/>
          </svg>
        </div>
        <div>
          <div style={{fontSize:9,color:C.textHint,marginBottom:2}}>上次连接</div>
          <div style={{fontSize:14,fontWeight:700,color:C.text}}>EdgeServer-5G</div>
        </div>
      </div>
      <div style={{padding:"7px 14px",background:C.blue,borderRadius:20,fontSize:12,fontWeight:600,color:"white",cursor:"pointer"}}>连接</div>
    </div>
  </div>;
}

/* ③ Error */
function ErrorScreen(){
  return <div style={{height:"100%",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",
    background:"linear-gradient(180deg,#f8faff 0%,#f0f5ff 100%)"}}>
    <BlobBg/>
    <TopBar title="连接失败"/>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:20,zIndex:1}}>
      <div style={{width:72,height:72,borderRadius:36,background:"rgba(239,68,68,0.10)",
        border:"1.5px solid rgba(239,68,68,0.20)",display:"flex",alignItems:"center",justifyContent:"center",
        animation:"shakeLoop 5s ease-in-out infinite"}}>
        <span style={{fontSize:28,color:C.red,fontWeight:800}}>✕</span>
      </div>
      <div style={{fontSize:18,fontWeight:800,color:C.text,marginTop:14}}>连接失败</div>
      <div style={{fontSize:12,color:C.textSub,marginTop:4}}>无法访问内网服务</div>
    </div>
    <div style={{margin:"16px 16px 0",background:C.white,borderRadius:14,padding:"14px 16px",
      boxShadow:"0 4px 16px rgba(239,68,68,0.08)",border:"1px solid rgba(239,68,68,0.12)",zIndex:1}}>
      <div style={{fontSize:10,color:C.red,fontWeight:600,marginBottom:8}}>可能原因</div>
      {["WiFi 网络配置有误，请重新扫码","边缘服务器未开机或不在同一内网","设备系统限制了 WiFi 自动切换"].map((t,i)=>(
        <div key={i} style={{display:"flex",gap:8,marginBottom:6,alignItems:"flex-start"}}>
          <div style={{width:16,height:16,borderRadius:8,background:"rgba(239,68,68,0.10)",
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,marginTop:1}}>
            <span style={{fontSize:9,color:C.red,fontWeight:700}}>{i+1}</span>
          </div>
          <span style={{fontSize:11,color:C.textSub,lineHeight:1.6}}>{t}</span>
        </div>
      ))}
    </div>
    <div style={{margin:"auto 16px 24px",zIndex:1}}>
      <div style={{height:50,borderRadius:25,background:C.blue,display:"flex",alignItems:"center",
        justifyContent:"center",cursor:"pointer",boxShadow:"0 6px 20px rgba(66,170,245,0.30)"}}>
        <span style={{fontSize:14,fontWeight:700,color:"white"}}>↺ 重新扫码</span>
      </div>
    </div>
  </div>;
}

/* ④ WiFi */
function WifiScreen(){
  return <div style={{height:"100%",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",
    background:"linear-gradient(180deg,#f8faff 0%,#f0f5ff 100%)"}}>
    <BlobBg/>
    <TopBar title="连接 WiFi"/>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:12,zIndex:1}}>
      <div style={{position:"relative",width:72,height:72,display:"flex",alignItems:"center",justifyContent:"center"}}>
        {[0,1].map(i=><div key={i} style={{position:"absolute",inset:0,borderRadius:"50%",
          border:"1px solid rgba(66,170,245,0.25)",animation:"wifiRing 2.4s ease-out infinite",animationDelay:`${i*1.2}s`}}/>)}
        <div style={{width:56,height:56,borderRadius:28,background:C.blueSoft,
          border:`1px solid ${C.blueBorder}`,display:"flex",alignItems:"center",justifyContent:"center"}}>
          <svg width="26" height="20" viewBox="0 0 26 20" fill="none">
            <circle cx="13" cy="17" r="2.2" fill={C.blue}/>
            <path d="M7,11C9,9 11,8 13,8s6,1,6,3" stroke={C.blueL} strokeWidth="1.8" strokeLinecap="round"/>
            <path d="M2,6C5.5,2.5 9,1 13,1s7.5,1.5 11,5" stroke={C.blue} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
      <div style={{fontSize:17,fontWeight:800,color:C.text,marginTop:14}}>需要手动连接 WiFi</div>
      <div style={{fontSize:12,color:C.textSub,marginTop:4}}>当前设备不支持自动切换</div>
    </div>
    <div style={{margin:"16px 16px 0",background:C.white,borderRadius:14,padding:"14px 16px",
      boxShadow:`0 4px 16px ${C.shadow}`,zIndex:1}}>
      <div style={{fontSize:10,color:C.textHint,marginBottom:8}}>目标网络</div>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div>
          <div style={{fontSize:15,fontWeight:700,color:C.text}}>EdgeServer-5G</div>
          <div style={{fontSize:10,color:C.textHint,marginTop:2}}>WPA2 · 5GHz</div>
        </div>
        <div style={{padding:"7px 14px",background:C.blueSoft,borderRadius:8,
          border:`1px solid ${C.blueBorder}`,fontSize:12,fontWeight:600,color:C.blue,cursor:"pointer"}}>复制密码</div>
      </div>
    </div>
    <div style={{margin:"10px 16px 0",background:C.white,borderRadius:14,padding:"14px 16px",
      boxShadow:`0 4px 16px ${C.shadow}`,zIndex:1}}>
      {["点击「复制密码」","前往系统设置 → WiFi","选择网络并粘贴密码","返回本应用继续"].map((t,i)=>(
        <div key={i} style={{display:"flex",gap:10,alignItems:"center",marginBottom:i<3?10:0}}>
          <div style={{width:22,height:22,borderRadius:11,background:C.blue,
            display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
            <span style={{fontSize:10,color:"white",fontWeight:700}}>{i+1}</span>
          </div>
          <span style={{fontSize:12,color:C.textSub}}>{t}</span>
        </div>
      ))}
    </div>
    <div style={{margin:"auto 16px 24px",zIndex:1}}>
      <div style={{height:50,borderRadius:25,background:C.blue,display:"flex",alignItems:"center",
        justifyContent:"center",cursor:"pointer",boxShadow:"0 6px 20px rgba(66,170,245,0.30)"}}>
        <span style={{fontSize:14,fontWeight:700,color:"white"}}>已连接，继续 ▸</span>
      </div>
    </div>
  </div>;
}

/* ⑤ Loading */
function LoadingScreen(){
  const steps=[{label:"解析配置信息",done:true},{label:"连接目标 WiFi",done:true},
    {label:"校验内网可达性",active:true},{label:"加载微应用列表",pending:true}];
  return <div style={{height:"100%",display:"flex",flexDirection:"column",position:"relative",overflow:"hidden",
    background:"linear-gradient(180deg,#f8faff 0%,#f0f5ff 100%)"}}>
    <BlobBg/>
    <TopBar title="正在连接"/>
    <div style={{display:"flex",justifyContent:"center",marginTop:20,zIndex:1}}>
      <div style={{position:"relative",width:90,height:90}}>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",border:"6px solid rgba(66,170,245,0.10)"}}/>
        <div style={{position:"absolute",inset:0,borderRadius:"50%",
          border:"6px solid transparent",borderTopColor:C.blue,animation:"spinCW 1.2s linear infinite"}}/>
        <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center"}}>
          <span style={{fontSize:20,fontWeight:800,color:C.text}}>75%</span>
        </div>
      </div>
    </div>
    <div style={{textAlign:"center",marginTop:14,zIndex:1}}>
      <div style={{fontSize:15,fontWeight:700,color:C.text}}>校验内网可达性</div>
      <div style={{fontSize:11,color:C.textHint,marginTop:4}}>请稍候，勿锁屏...</div>
    </div>
    <div style={{margin:"20px 16px 0",background:C.white,borderRadius:14,padding:"16px",
      boxShadow:`0 4px 16px ${C.shadow}`,zIndex:1}}>
      {steps.map(({label,done,active,pending},i)=>(
        <div key={label} style={{display:"flex",alignItems:"center",gap:12,marginBottom:i<3?12:0,opacity:pending?.3:1}}>
          <div style={{width:24,height:24,borderRadius:12,flexShrink:0,
            background:done?C.green:active?C.blue:"rgba(66,170,245,0.08)",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            {done?<span style={{color:"white",fontSize:12,fontWeight:700}}>✓</span>
              :active?<div style={{width:10,height:10,borderRadius:5,border:"2px solid white",borderTopColor:"transparent",animation:"spinCW .8s linear infinite"}}/>
              :<div style={{width:6,height:6,borderRadius:3,background:"rgba(66,170,245,0.2)"}}/>}
          </div>
          <span style={{fontSize:12,color:active?C.text:C.textHint,fontWeight:active?700:400}}>{label}</span>
          {done&&<span style={{fontSize:10,color:C.green,marginLeft:"auto",fontWeight:600}}>✓</span>}
        </div>
      ))}
    </div>
  </div>;
}

/* ⑥ Desktop */
function DesktopScreen(){
  const [showToast,setShowToast]=useState(false);
  const apps=[
    {n:"设备管理",ic:"📡",s:"on"},{n:"系统设置",ic:"⚙️",s:"on"},
    {n:"视频监控",ic:"📹",s:"on"},{n:"数据分析",ic:"📊",s:"on"},
    {n:"告警中心",ic:"🔔",s:"warn"},{n:"日志查看",ic:"📋",s:"on"},
    {n:"工单系统",ic:"🗂",s:"off"},{n:"配置下发",ic:"🔧",s:"on"},
    {n:"远程控制",ic:"🕹",s:"on"},{n:"资产台账",ic:"🏷",s:"warn"},
    {n:"报表导出",ic:"📤",s:"on"},{n:"权限管理",ic:"🔐",s:"on"},
  ];
  return <div style={{height:"100%",background:C.bg,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
    <BlobBg/>
    {showToast&&<div style={{position:"absolute",top:56,left:16,right:16,zIndex:999,
      background:"rgba(255,251,235,0.97)",border:"1px solid rgba(245,158,11,0.35)",borderLeft:"3px solid #f59e0b",
      borderRadius:10,padding:"10px 14px",display:"flex",alignItems:"center",gap:8,
      boxShadow:"0 4px 16px rgba(245,158,11,0.12)"}}>
      <span style={{fontSize:16}}>⚠️</span>
      <span style={{fontSize:13,color:"#92400e",fontWeight:600}}>服务未启动，请联系管理员</span>
    </div>}
    {/* topbar */}
    <div style={{padding:"10px 16px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",
      background:"rgba(255,255,255,0.90)",borderBottom:"1px solid rgba(66,170,245,0.08)",
      position:"relative",zIndex:5,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:10}}>
        <div style={{width:36,height:36,borderRadius:10,background:C.white,
          boxShadow:"0 2px 8px rgba(66,170,245,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <AppIcon size={26}/>
        </div>
        <div>
          <div style={{fontSize:14,fontWeight:800,color:C.text}}>微应用桌面</div>
          <div style={{fontSize:9,color:C.textHint,marginTop:1}}>EdgeServer-5G · ONLINE</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:8}}>
        <div style={{width:7,height:7,borderRadius:"50%",background:C.green,animation:"blink 2s infinite"}}/>
        <div style={{width:36,height:36,borderRadius:10,background:C.white,
          boxShadow:"0 2px 8px rgba(66,170,245,0.10)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke={C.blueL} strokeWidth="1.8"/>
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke={C.blueL} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
    {/* grid */}
    <div style={{flex:1,overflowY:"auto",padding:"10px 14px 16px",
      display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:16,alignContent:"start",position:"relative",zIndex:5}}>
      {apps.map(({n,ic,s},idx)=>(
        <div key={n} onClick={()=>s==="off"&&setShowToast(true)}
          style={{display:"flex",flexDirection:"column",alignItems:"center",gap:5,cursor:"pointer",
          position:"relative",opacity:s==="off"?.4:1,
          animation:`floatY ${3.5+idx*.15}s ${idx*.12}s ease-in-out infinite`}}>
          {s==="warn"&&<div style={{position:"absolute",top:-2,right:0,width:8,height:8,borderRadius:4,
            background:C.amber,animation:"blink 1.5s infinite",zIndex:2,border:"2px solid "+C.bg}}/>}
          <div style={{width:52,height:52,borderRadius:16,overflow:"hidden",position:"relative",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:30,lineHeight:1}}>{ic}</div>
            {s==="off"&&<div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.70)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:18,color:"rgba(0,0,0,0.30)"}}>⊘</div>}
          </div>
          <div style={{fontSize:9,color:s==="off"?C.textHint:C.text,fontWeight:500,textAlign:"center",lineHeight:1.3}}>{n}</div>
        </div>
      ))}
    </div>
  </div>;
}

/* iPad versions */
function InitScreenPad(){
  return <div style={{height:"100%",position:"relative",overflow:"hidden",
    background:"linear-gradient(180deg,#f8faff 0%,#f0f5ff 100%)",display:"flex",flexDirection:"column",alignItems:"center"}}>
    <BlobBg/>
    <div style={{height:20}}/>
    <div style={{display:"flex",flexDirection:"column",alignItems:"center",marginTop:36,zIndex:1}}>
      <div style={{width:100,height:100,borderRadius:28,background:C.white,
        boxShadow:"0 10px 36px rgba(66,170,245,0.16)",display:"flex",alignItems:"center",justifyContent:"center",marginBottom:22}}>
        <AppIcon size={70}/>
      </div>
      <div style={{fontSize:32,fontWeight:900,color:C.text,letterSpacing:-.5}}>微应用桌面</div>
      <div style={{fontSize:14,color:C.textSub,marginTop:8,letterSpacing:1}}>点亮智慧连接</div>
    </div>
    <div style={{flex:1,display:"flex",alignItems:"center",justifyContent:"center",zIndex:1}}>
      <div style={{textAlign:"center"}}>
        <div style={{fontSize:15,color:C.textSub,lineHeight:1.9}}>扫描企业二维码，即刻接入内网微应用服务平台</div>
      </div>
    </div>
    <div style={{padding:"0 64px 44px",width:"100%",zIndex:1}}>
      <div style={{height:60,borderRadius:30,background:C.blue,display:"flex",alignItems:"center",
        justifyContent:"center",gap:12,cursor:"pointer",boxShadow:"0 10px 28px rgba(66,170,245,0.35)"}}>
        <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
          <path d="M3 9V5a2 2 0 0 1 2-2h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M21 9V5a2 2 0 0 0-2-2h-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M3 15v4a2 2 0 0 0 2 2h4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <path d="M21 15v4a2 2 0 0 1-2 2h-4" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <line x1="5" y1="12" x2="19" y2="12" stroke="white" strokeWidth="2" strokeLinecap="round"/>
          <rect x="9" y="9" width="6" height="6" rx="1" stroke="white" strokeWidth="1.6" fill="none"/>
        </svg>
        <span style={{fontSize:18,fontWeight:700,color:"white"}}>扫码连接</span>
      </div>
      <div style={{marginTop:14,height:52,borderRadius:26,background:"rgba(66,170,245,0.06)",
        border:`1px solid ${C.blueBorder}`,display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
        <span style={{fontSize:15,color:C.blueL,fontWeight:600}}>从历史记录连接</span>
      </div>
    </div>
  </div>;
}

function DesktopScreenPad(){
  const apps=[
    {n:"设备管理",ic:"📡",s:"on"},{n:"系统设置",ic:"⚙️",s:"on"},{n:"视频监控",ic:"📹",s:"on"},{n:"数据分析",ic:"📊",s:"on"},
    {n:"告警中心",ic:"🔔",s:"warn"},{n:"日志查看",ic:"📋",s:"on"},{n:"工单系统",ic:"🗂",s:"off"},{n:"配置下发",ic:"🔧",s:"on"},
    {n:"远程控制",ic:"🕹",s:"on"},{n:"资产台账",ic:"🏷",s:"warn"},{n:"报表导出",ic:"📤",s:"on"},{n:"权限管理",ic:"🔐",s:"on"},
    {n:"IoT管理",ic:"📡",s:"on"},{n:"网络拓扑",ic:"🌐",s:"on"},{n:"服务监控",ic:"🖥",s:"on"},{n:"日志告警",ic:"📢",s:"on"},
  ];
  return <div style={{height:"100%",background:C.bg,display:"flex",flexDirection:"column",overflow:"hidden",position:"relative"}}>
    <BlobBg/>
    <div style={{padding:"10px 24px 8px",display:"flex",alignItems:"center",justifyContent:"space-between",
      background:"rgba(255,255,255,0.90)",borderBottom:"1px solid rgba(66,170,245,0.08)",position:"relative",zIndex:5,flexShrink:0}}>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:44,height:44,borderRadius:12,background:C.white,
          boxShadow:"0 2px 10px rgba(66,170,245,0.12)",display:"flex",alignItems:"center",justifyContent:"center"}}>
          <AppIcon size={30}/>
        </div>
        <div>
          <div style={{fontSize:18,fontWeight:800,color:C.text}}>微应用桌面</div>
          <div style={{fontSize:10,color:C.textHint}}>EdgeServer-5G · ONLINE</div>
        </div>
      </div>
      <div style={{display:"flex",alignItems:"center",gap:12}}>
        <div style={{width:220,height:38,borderRadius:19,background:C.white,
          border:"1px solid rgba(66,170,245,0.10)",display:"flex",alignItems:"center",gap:8,padding:"0 14px",
          boxShadow:"0 2px 8px rgba(66,170,245,0.06)"}}>
          <svg width="13" height="13" viewBox="0 0 10 10" fill="none">
            <circle cx="4" cy="4" r="3" stroke={C.textHint} strokeWidth="1.3"/>
            <line x1="6.5" y1="6.5" x2="9" y2="9" stroke={C.textHint} strokeWidth="1.3" strokeLinecap="round"/>
          </svg>
          <span style={{fontSize:12,color:C.textHint}}>搜索微应用...</span>
        </div>
        <div style={{width:7,height:7,borderRadius:"50%",background:C.green,animation:"blink 2s infinite"}}/>
        <div style={{width:44,height:44,borderRadius:12,background:C.white,
          boxShadow:"0 2px 10px rgba(66,170,245,0.10)",display:"flex",alignItems:"center",justifyContent:"center",cursor:"pointer"}}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="3" stroke={C.blueL} strokeWidth="1.8"/>
            <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42"
              stroke={C.blueL} strokeWidth="1.8" strokeLinecap="round"/>
          </svg>
        </div>
      </div>
    </div>
    <div style={{flex:1,overflowY:"auto",padding:"14px 24px",
      display:"grid",gridTemplateColumns:"repeat(8,1fr)",gap:18,alignContent:"start",position:"relative",zIndex:5}}>
      {apps.map(({n,ic,s},idx)=>(
        <div key={n} style={{display:"flex",flexDirection:"column",alignItems:"center",gap:6,cursor:"pointer",
          position:"relative",opacity:s==="off"?.4:1,animation:`floatY ${3.5+idx*.15}s ${idx*.12}s ease-in-out infinite`}}>
          {s==="warn"&&<div style={{position:"absolute",top:-2,right:0,width:8,height:8,borderRadius:4,
            background:C.amber,animation:"blink 1.5s infinite",zIndex:2,border:"2px solid "+C.bg}}/>}
          <div style={{width:56,height:56,borderRadius:18,overflow:"hidden",position:"relative",
            display:"flex",alignItems:"center",justifyContent:"center"}}>
            <div style={{fontSize:32,lineHeight:1}}>{ic}</div>
            {s==="off"&&<div style={{position:"absolute",inset:0,background:"rgba(255,255,255,0.70)",
              display:"flex",alignItems:"center",justifyContent:"center",fontSize:20,color:"rgba(0,0,0,0.28)"}}>⊘</div>}
          </div>
          <div style={{fontSize:9,color:s==="off"?C.textHint:C.text,fontWeight:500,textAlign:"center",lineHeight:1.3}}>{n}</div>
        </div>
      ))}
    </div>
  </div>;
}

export default function App(){
  const [active,setActive]=useState("init");
  const phoneMap={init:<InitScreen/>,scan:<ScanScreen/>,error:<ErrorScreen/>,
    wifi:<WifiScreen/>,loading:<LoadingScreen/>,desktop:<DesktopScreen/>};
  const padMap={init:<InitScreenPad/>,scan:<ScanScreen/>,error:<ErrorScreen/>,
    wifi:<WifiScreen/>,loading:<LoadingScreen/>,desktop:<DesktopScreenPad/>};
  const info=SCREENS.find(s=>s.id===active);

  return <div style={{minHeight:"100vh",background:"#dde5ff",fontFamily:"'Noto Sans SC',sans-serif",padding:"32px 20px 80px"}}>
    <style>{CSS}</style>
    <div style={{textAlign:"center",marginBottom:32}}>
      <div style={{display:"inline-flex",alignItems:"center",gap:8,marginBottom:12,
        padding:"5px 18px",borderRadius:20,background:"white",boxShadow:"0 2px 12px rgba(66,170,245,0.12)",
        border:"1px solid rgba(66,170,245,0.10)"}}>
        <div style={{width:6,height:6,borderRadius:"50%",background:C.blue,animation:"blink 1.5s infinite"}}/>
        <span style={{fontSize:11,color:C.blueL,letterSpacing:2,fontWeight:600}}>UI DESIGN SPEC · v4.0 · LIGHT THEME · PHONE + iPAD</span>
        <div style={{width:6,height:6,borderRadius:"50%",background:C.blue,animation:"blink 1.5s .5s infinite"}}/>
      </div>
      <h1 style={{fontSize:32,fontWeight:900,color:C.text,letterSpacing:-.5}}>微应用桌面 App</h1>
      <p style={{fontSize:11,color:C.textSub,marginTop:6,letterSpacing:.5}}>Light Theme · Edge Server · #1E21F7 Blue</p>
    </div>

    <div style={{display:"flex",justifyContent:"center",gap:8,marginBottom:36,flexWrap:"wrap"}}>
      {SCREENS.map(s=>(
        <button key={s.id} onClick={()=>setActive(s.id)} style={{
          padding:"8px 18px",borderRadius:20,border:"none",cursor:"pointer",fontFamily:"inherit",
          background:active===s.id?C.blue:"white",color:active===s.id?"white":C.textSub,
          fontSize:12,fontWeight:600,transition:"all .2s",
          boxShadow:active===s.id?"0 4px 16px rgba(66,170,245,0.35)":"0 2px 8px rgba(66,170,245,0.08)",
        }}>{s.label}</button>
      ))}
    </div>

    {/* 主预览 */}
    <div style={{display:"flex",justifyContent:"center",alignItems:"flex-start",gap:52,marginBottom:56,flexWrap:"wrap"}}>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{fontSize:10,color:C.textHint,letterSpacing:2,fontWeight:600,marginBottom:4}}>ANDROID</div>
        <Phone label={info.label} en={info.en}>{phoneMap[active]}</Phone>
      </div>
      <div style={{display:"flex",flexDirection:"column",alignItems:"center",gap:10}}>
        <div style={{fontSize:10,color:C.textHint,letterSpacing:2,fontWeight:600,marginBottom:4}}>iPAD</div>
        <Pad label={info.label} en={info.en}>{padMap[active]}</Pad>
      </div>
    </div>

    {/* ALL SCREENS · PHONE */}
    <div style={{textAlign:"center",marginBottom:14}}>
      <span style={{fontSize:10,color:C.textSub,letterSpacing:2,fontWeight:600}}>ALL SCREENS · PHONE</span>
    </div>
    <div style={{display:"flex",gap:10,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
      {SCREENS.map(s=>(
        <div key={s.id} onClick={()=>setActive(s.id)} style={{cursor:"pointer"}}>
          <div style={{width:100,height:212,background:C.bg,borderRadius:20,
            border:active===s.id?`2px solid ${C.blue}`:"1.5px solid rgba(66,170,245,0.10)",
            overflow:"hidden",position:"relative",
            boxShadow:active===s.id?"0 6px 20px rgba(66,170,245,0.25)":"0 2px 10px rgba(66,170,245,0.08)",
            transform:active===s.id?"scale(1.05)":"scale(1)",transition:"all .2s"}}>
            <div style={{position:"absolute",top:0,left:"50%",transform:"translateX(-50%)",
              width:36,height:7,background:C.bg,borderRadius:"0 0 5px 5px",zIndex:10}}/>
            <div style={{transform:"scale(.357)",transformOrigin:"top left",width:"280%",height:"280%",position:"absolute",top:0,left:0}}>
              <div style={{width:280,height:590,paddingTop:44,overflow:"hidden"}}>{phoneMap[s.id]}</div>
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:6,fontSize:9,
            color:active===s.id?C.blue:C.textHint,fontWeight:active===s.id?700:400}}>{s.label}</div>
        </div>
      ))}
    </div>

    {/* ALL SCREENS · iPAD */}
    <div style={{textAlign:"center",marginBottom:14}}>
      <span style={{fontSize:10,color:C.textSub,letterSpacing:2,fontWeight:600}}>ALL SCREENS · iPAD</span>
    </div>
    <div style={{display:"flex",gap:12,justifyContent:"center",flexWrap:"wrap",marginBottom:40}}>
      {SCREENS.map(s=>(
        <div key={s.id} onClick={()=>setActive(s.id)} style={{cursor:"pointer"}}>
          <div style={{width:156,height:212,background:C.bg,borderRadius:16,
            border:active===s.id?`2px solid ${C.blue}`:"1.5px solid rgba(66,170,245,0.10)",
            overflow:"hidden",position:"relative",
            boxShadow:active===s.id?"0 6px 20px rgba(66,170,245,0.25)":"0 2px 10px rgba(66,170,245,0.08)",
            transform:active===s.id?"scale(1.04)":"scale(1)",transition:"all .2s"}}>
            <div style={{position:"absolute",bottom:4,left:"50%",transform:"translateX(-50%)",
              width:44,height:3,background:"rgba(66,170,245,0.12)",borderRadius:2,zIndex:10}}/>
            <div style={{transform:"scale(.354)",transformOrigin:"top left",width:"282%",height:"282%",position:"absolute",top:0,left:0}}>
              <div style={{width:440,height:590,paddingTop:36,overflow:"hidden"}}>{padMap[s.id]}</div>
            </div>
          </div>
          <div style={{textAlign:"center",marginTop:6,fontSize:9,
            color:active===s.id?C.blue:C.textHint,fontWeight:active===s.id?700:400}}>{s.label} · iPad</div>
        </div>
      ))}
    </div>
  </div>;
}
