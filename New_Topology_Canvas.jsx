import React from 'react';

// Modern, sleek Stacked Tag Component
const StackedTag = ({ text, positionClass, colorTheme = 'blue' }) => {
  const themeMap = {
    blue: 'from-sky-400 to-blue-500 border-sky-300',
    fuchsia: 'from-fuchsia-400 to-purple-500 border-fuchsia-300',
  };
  const bgClass = themeMap[colorTheme] || themeMap.blue;

  return (
    <div className={`flex flex-col items-center z-30 w-full ${positionClass} drop-shadow-md`}>
      <div className="relative w-14 h-[20px] mx-auto">
        <div className={`absolute bg-gradient-to-r ${bgClass} w-full h-full left-1 -top-1 rounded opacity-40`}></div>
        <div className={`absolute bg-gradient-to-r ${bgClass} w-full h-full left-0.5 -top-0.5 rounded opacity-70`}></div>
        <div className={`absolute bg-gradient-to-r ${bgClass} w-full h-full left-0 top-0 text-white text-[10px] flex items-center justify-center border border-white/50 rounded font-bold tracking-wider shadow-sm`}>
          {text}
        </div>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <div className="w-full overflow-x-auto bg-gradient-to-br from-slate-100 to-slate-200 p-8 flex justify-center items-center min-h-screen font-sans">
      <div className="relative w-[1050px] h-[550px] bg-white/60 backdrop-blur-xl shadow-2xl border border-white rounded-3xl flex-shrink-0 overflow-hidden">
        
        {/* ======================= BACKGROUND SVG FOR LINES ======================= */}
        <svg className="absolute inset-0 z-[5] pointer-events-none drop-shadow-sm" width="1050" height="550">
          <defs>
            <marker id="arrow-indigo" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse">
              <path d="M 0 0 L 10 5 L 0 10 z" fill="#6366f1" />
            </marker>
          </defs>

          {/* Connection Modem/MT -> SRF */}
          <path d="M 195 307.5 C 245 307.5, 245 325, 290 325" fill="none" stroke="#6366f1" strokeWidth="2.5" markerEnd="url(#arrow-indigo)" strokeLinecap="round" className="drop-shadow-sm" />

          {/* BLUE BUS & VERTICAL CONNECTIONS (DBI) */}
          <line x1="380" y1="510" x2="950" y2="510" stroke="#7dd3fc" strokeWidth="3" strokeLinecap="round" />
          
          {/* Drops to Blue Bus */}
          <line x1="440" y1="270" x2="440" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4 2" />
          <line x1="560" y1="270" x2="560" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4 2" />
          <line x1="660" y1="270" x2="660" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4 2" />
          <line x1="760" y1="270" x2="760" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeDasharray="4 2" />

          {/* Drops from Tools to Blue Bus */}
          <line x1="440" y1="440" x2="440" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
          <line x1="560" y1="440" x2="560" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
          <line x1="660" y1="440" x2="660" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
          <line x1="760" y1="440" x2="760" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />
          <line x1="860" y1="440" x2="860" y2="510" stroke="#7dd3fc" strokeWidth="2" strokeLinecap="round" />

          {/* RED BUS & VERTICAL CONNECTIONS (ABI) */}
          <line x1="325" y1="340" x2="970" y2="340" stroke="#fda4af" strokeWidth="3" strokeLinecap="round" />
          
          {/* Drops from Agents to Red Bus */}
          <line x1="420" y1="270" x2="420" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          <line x1="540" y1="270" x2="540" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          <line x1="640" y1="270" x2="640" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          <line x1="740" y1="270" x2="740" y2="340" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          
          {/* Drops from Red Bus to Tools */}
          <line x1="420" y1="340" x2="420" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          <line x1="540" y1="340" x2="540" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          <line x1="640" y1="340" x2="640" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          <line x1="740" y1="340" x2="740" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
          <line x1="840" y1="340" x2="840" y2="380" stroke="#fda4af" strokeWidth="2" strokeLinecap="round" />
        </svg>

        {/* ======================= HTML OVERLAYS & BOXES ======================= */}

        {/* --- MAIN CONTAINERS --- */}
        {/* Agentic Core Outline */}
        <div className="absolute border-[1.5px] border-slate-300 bg-white/20 backdrop-blur-sm rounded-2xl z-0 pointer-events-none shadow-inner" style={{ left: 280, top: 70, width: 730, height: 460 }}>
          <div className="flex justify-center pt-5 relative z-20">
            <span className="font-extrabold text-2xl text-slate-700 tracking-wider drop-shadow-sm">
              Agentic Core
            </span>
          </div>
        </div>

        {/* Service Agents Dashed Box */}
        <div className="absolute border-2 border-dashed border-slate-300 bg-slate-50/30 rounded-xl z-0 pointer-events-none" style={{ left: 490, top: 140, width: 380, height: 160 }}>
          <div className="absolute top-2 right-4 font-semibold text-lg text-slate-500">Service agents</div>
        </div>

        {/* --- LEFT SIDE: USER & UE REFACTORED --- */}
        
        {/* Connection User -> UE */}
        <div className="absolute w-[3px] bg-indigo-200 z-0 rounded-full" style={{ left: 138.5, top: 110, height: 35 }}></div>

        {/* Modern User Avatar */}
        <div className="absolute flex justify-center z-20 drop-shadow-lg hover:-translate-y-1 transition-transform cursor-default" style={{ left: 120, top: 55, width: 40, height: 60 }}>
          <svg width="40" height="60" viewBox="0 0 40 60">
            <circle cx="20" cy="18" r="12" fill="url(#userGrad)" stroke="#4f46e5" strokeWidth="2" />
            <path d="M 5 55 C 5 40, 35 40, 35 55 Z" fill="#ffffff" stroke="#4f46e5" strokeWidth="2" strokeLinejoin="round" />
            <defs>
              <linearGradient id="userGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#e0e7ff" />
                <stop offset="100%" stopColor="#c7d2fe" />
              </linearGradient>
            </defs>
          </svg>
        </div>

        {/* UE Box Outline */}
        <div className="absolute border border-indigo-100 bg-white/70 shadow-[0_8px_30px_rgb(0,0,0,0.08)] rounded-3xl flex flex-col z-10 backdrop-blur-xl overflow-hidden" style={{ left: 70, top: 140, width: 140, height: 220 }}>
          <div className="w-full bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-indigo-100 py-2.5 flex justify-center shadow-sm">
            <span className="font-black text-lg text-indigo-900 tracking-wider">UE</span>
          </div>
        </div>

        {/* Connection OS/UE Agent -> Modem/MT */}
        <div className="absolute w-[3px] bg-indigo-200 z-10 rounded-full" style={{ left: 138.5, top: 235, height: 60 }}></div>

        {/* OS/UE Agent */}
        <div className="absolute bg-gradient-to-br from-indigo-500 to-blue-600 shadow-lg shadow-blue-500/30 rounded-xl flex items-center justify-center text-center font-bold text-white z-20 hover:scale-105 transition-transform text-sm leading-tight border border-indigo-400" style={{ left: 85, top: 195, width: 110, height: 45 }}>
          OS/UE<br/>Agent
        </div>

        {/* Modem/MT */}
        <div className="absolute bg-white shadow-md rounded-xl flex items-center justify-center text-center font-bold text-slate-700 z-20 hover:scale-105 transition-transform text-sm leading-tight border border-slate-200" style={{ left: 85, top: 285, width: 110, height: 45 }}>
          Modem/MT
        </div>


        {/* --- RIGHT SIDE: AGENTIC CORE COMPONENTS --- */}
        {/* SRF */}
        <div className="absolute bg-gradient-to-br from-rose-100 to-pink-200 border border-pink-300 shadow-lg rounded-xl flex items-center justify-center font-extrabold text-xl text-pink-900 z-10" style={{ left: 295, top: 290, width: 60, height: 70 }}>
          SRF
        </div>

        {/* ARF */}
        <div className="absolute bg-gradient-to-br from-rose-100 to-pink-200 border border-pink-300 shadow-lg rounded-xl flex items-center justify-center font-extrabold text-xl text-pink-900 z-10" style={{ left: 970, top: 290, width: 60, height: 70 }}>
          ARF
        </div>

        {/* Sys-Agent */}
        <div className="absolute bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200 shadow-md rounded-2xl flex flex-col items-center justify-center z-10 hover:-translate-y-1 transition-transform" style={{ left: 390, top: 180, width: 80, height: 90 }}>
          <div className="font-semibold text-center leading-tight text-rose-900 mb-1.5 mt-1">Sys-<br/>Agent</div>
          <StackedTag text="Skills" positionClass="relative" />
        </div>

        {/* Conn-Agent */}
        <div className="absolute bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200 shadow-md rounded-2xl flex flex-col items-center justify-center z-10 hover:-translate-y-1 transition-transform" style={{ left: 510, top: 180, width: 80, height: 90 }}>
          <div className="font-semibold text-center leading-tight text-rose-900 mb-1.5 mt-1">Conn-<br/>Agent</div>
          <StackedTag text="Skills" positionClass="relative" />
        </div>

        {/* Comp-Agent */}
        <div className="absolute bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200 shadow-md rounded-2xl flex flex-col items-center justify-center z-10 hover:-translate-y-1 transition-transform" style={{ left: 610, top: 180, width: 80, height: 90 }}>
          <div className="font-semibold text-center leading-tight text-rose-900 mb-1.5 mt-1">Comp-<br/>Agent</div>
          <StackedTag text="Skills" positionClass="relative" />
        </div>

        {/* Data-Agent */}
        <div className="absolute bg-gradient-to-br from-pink-50 to-rose-100 border border-pink-200 shadow-md rounded-2xl flex flex-col items-center justify-center z-10 hover:-translate-y-1 transition-transform" style={{ left: 710, top: 180, width: 80, height: 90 }}>
          <div className="font-semibold text-center leading-tight text-rose-900 mb-1.5 mt-1">Data-<br/>Agent</div>
          <StackedTag text="Skills" positionClass="relative" />
        </div>

        {/* Service Agents Ellipsis */}
        <div className="absolute text-4xl font-black tracking-widest text-slate-400 z-10" style={{ left: 820, top: 195 }}>
          ...
        </div>

        {/* Tools Boxes */}
        {[
          { name: "AM", left: 395 },
          { name: "SM", left: 515 },
          { name: "Policy", left: 615 },
          { name: "UP", left: 715 },
          { name: "DP", left: 815 }
        ].map((tool) => (
          <div key={tool.name} className="absolute bg-gradient-to-t from-slate-100 to-white border border-slate-200 shadow-lg flex flex-col items-center justify-end pb-2 rounded-xl z-10 hover:shadow-xl transition-shadow" style={{ left: tool.left, top: 380, width: 70, height: 60 }}>
            <StackedTag text="Tools" positionClass="absolute top-[-10px]" />
            <span className="font-bold text-[15px] text-slate-700">{tool.name}</span>
          </div>
        ))}

        {/* Tools Ellipsis */}
        <div className="absolute text-4xl font-black tracking-widest text-slate-400 z-10" style={{ left: 890, top: 390 }}>
          ...
        </div>

        {/* Bus Labels */}
        <div className="absolute text-rose-500 text-lg font-black tracking-widest z-10 drop-shadow-sm" style={{ left: 915, top: 320 }}>
          ABI
        </div>
        <div className="absolute text-sky-500 text-lg font-black tracking-widest z-10 drop-shadow-sm" style={{ left: 915, top: 490 }}>
          DBI
        </div>

      </div>
    </div>
  );
}