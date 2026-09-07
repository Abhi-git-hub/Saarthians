const features = [
  ["01", "Learn with direction", "A focused home for notes, tests, results and the next best action."],
  ["02", "Understand, don’t memorize", "An AI learning partner that explains, questions and helps you practice."],
  ["03", "Progress you can see", "Turn every test and review into a clearer picture of where to improve."],
];

export default function Home() {
  return <main>
    <header className="container" style={{paddingTop:24}}>
      <nav style={{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"14px 0"}}>
        <a href="/" style={{fontWeight:800,fontSize:20,letterSpacing:"-.04em"}}>saarthians<span style={{color:"var(--accent)"}}>.online</span></a>
        <div style={{display:"flex",gap:28,alignItems:"center",fontSize:14}}>
          <a href="#experience">Experience</a><a href="#approach">Approach</a>
          <a href="/login" style={{background:"var(--ink)",color:"white",padding:"11px 17px",borderRadius:999}}>Sign in ↗</a>
        </div>
      </nav>
    </header>

    <section className="grid-bg" style={{marginTop:20,borderTop:"1px solid var(--line)",borderBottom:"1px solid var(--line)"}}>
      <div className="container" style={{padding:"100px 0 112px"}}>
        <div className="rise"><span className="eyebrow">A learning system with direction</span></div>
        <h1 className="rise-2" style={{fontSize:"clamp(54px,9vw,112px)",lineHeight:.91,letterSpacing:"-.075em",maxWidth:950,margin:"28px 0"}}>
          Study less randomly.<br/><i style={{fontFamily:"Georgia,serif",fontWeight:400}}>Learn more deeply.</i>
        </h1>
        <p className="rise-3" style={{fontSize:18,lineHeight:1.6,color:"var(--muted)",maxWidth:620,marginBottom:34}}>Saarthians brings your learning life into one calm, intelligent workspace — with notes, assessments, progress and an AI tutor built around your context.</p>
        <div className="rise-3" style={{display:"flex",gap:12,flexWrap:"wrap"}}>
          <a href="/login" style={{background:"var(--accent)",color:"white",padding:"14px 22px",borderRadius:999,fontWeight:700}}>Enter your workspace →</a>
          <a href="#experience" style={{border:"1px solid #cdd1c9",padding:"14px 22px",borderRadius:999,fontWeight:700}}>Explore Saarthians</a>
        </div>
      </div>
    </section>

    <section id="experience" className="container" style={{padding:"100px 0"}}>
      <span className="eyebrow">The experience</span>
      <div style={{display:"grid",gridTemplateColumns:"1fr 1.5fr",gap:60,marginTop:28}}>
        <h2 style={{fontSize:"clamp(34px,5vw,62px)",lineHeight:1,letterSpacing:"-.055em",margin:0}}>Everything you need to move forward.</h2>
        <div style={{display:"grid",gap:0}}>{features.map(([n,t,d])=><article key={n} style={{borderTop:"1px solid var(--line)",padding:"25px 0",display:"grid",gridTemplateColumns:"52px 1fr",gap:10}}><span style={{color:"var(--muted)",fontSize:13}}>{n}</span><div><h3 style={{margin:"0 0 7px",fontSize:21}}>{t}</h3><p style={{margin:0,color:"var(--muted)",lineHeight:1.6}}>{d}</p></div></article>)}</div>
      </div>
    </section>

    <section id="approach" style={{background:"var(--accent)",color:"white"}}>
      <div className="container" style={{padding:"90px 0",display:"grid",gridTemplateColumns:"1fr 1fr",gap:60}}>
        <div><span className="eyebrow" style={{color:"#dff4c0"}}>Built for real learning</span><h2 style={{fontSize:"clamp(40px,5vw,68px)",lineHeight:.98,letterSpacing:"-.06em",margin:"25px 0 0"}}>Technology should disappear.<br/>Learning should stay.</h2></div>
        <div style={{alignSelf:"end",color:"#d5dfdb",lineHeight:1.8,fontSize:16}}>Students get clarity without clutter. Teachers get the operational visibility they need. Every private record is protected by server-side authorization — not by what a browser happens to show.</div>
      </div>
    </section>

    <footer className="container" style={{padding:"34px 0 60px",display:"flex",justifyContent:"space-between",gap:20,color:"var(--muted)",fontSize:13}}><span>© 2026 Saarthians</span><span>Learn with direction.</span></footer>
  </main>;
}
