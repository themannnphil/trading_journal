import { redirect } from "next/navigation";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import Link from "next/link";

const G = "#F5A623";
const BG = "#0D0D0D";
const S1 = "#161616";
const S2 = "#1A1A1A";
const BD = "#252525";
const TX = "#F0F0F0";
const MT = "#888888";
const SB = "#555555";

export default async function RootPage() {
  const session = await getServerSession(authOptions);
  if (session) redirect("/journal");

  return (
    <>
      <style>{`
        *{box-sizing:border-box;margin:0;padding:0}
        .lp-btn{transition:opacity .15s,transform .15s}
        .lp-btn:hover{opacity:.88;transform:translateY(-1px)}
        .lp-ghost:hover{border-color:#444!important}
        .lp-card:hover{border-color:rgba(245,166,35,.28)!important}
        .lp-flink:hover{color:#aaa!important}
        @media(max-width:800px){
          .lp-hero{grid-template-columns:1fr!important}
          .lp-mock{display:none!important}
          .lp-steps{grid-template-columns:1fr!important;gap:32px!important}
          .lp-stats{grid-template-columns:1fr!important}
          .lp-foot{flex-direction:column!important;text-align:center!important;gap:16px!important}
        }
      `}</style>

      <div style={{background:BG,color:TX,fontFamily:"system-ui,-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif",overflowX:"hidden",minHeight:"100vh"}}>

        {/* ─── Nav ─────────────────────────────────────────────────── */}
        <nav style={{position:"sticky",top:0,zIndex:50,display:"flex",alignItems:"center",justifyContent:"space-between",padding:"0 32px",height:"64px",background:"rgba(13,13,13,.92)",backdropFilter:"blur(20px)",WebkitBackdropFilter:"blur(20px)",borderBottom:`1px solid ${BD}`}}>
          <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
            <span style={{color:G,fontSize:"22px"}}>◈</span>
            <span style={{fontSize:"17px",fontWeight:700,letterSpacing:"-.03em"}}>TradeLog</span>
          </div>
          <div style={{display:"flex",alignItems:"center",gap:"12px"}}>
            <Link href="/login" style={{fontSize:"13px",color:MT,textDecoration:"none",padding:"8px 4px"}}>Sign in</Link>
            <Link href="/login" className="lp-btn" style={{padding:"8px 20px",borderRadius:"10px",background:G,color:"#111",fontSize:"13px",fontWeight:700,textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
              Get Started
            </Link>
          </div>
        </nav>

        {/* ─── Hero ────────────────────────────────────────────────── */}
        <section style={{padding:"80px 32px 60px"}}>
          <div className="lp-hero" style={{maxWidth:"1160px",margin:"0 auto",display:"grid",gridTemplateColumns:"1fr 1fr",gap:"64px",alignItems:"center"}}>

            {/* Copy */}
            <div>
              <div style={{display:"inline-flex",alignItems:"center",gap:"6px",padding:"4px 14px",borderRadius:"99px",marginBottom:"24px",background:"rgba(245,166,35,.1)",border:"1px solid rgba(245,166,35,.22)",fontSize:"12px",fontWeight:600,color:G,letterSpacing:".01em"}}>
                ⚡ Built for funded traders
              </div>

              <h1 style={{fontSize:"clamp(38px,4.4vw,58px)",fontWeight:800,letterSpacing:"-.035em",lineHeight:1.08,marginBottom:"22px"}}>
                <span style={{background:`linear-gradient(150deg,${TX} 45%,${G})`,WebkitBackgroundClip:"text",WebkitTextFillColor:"transparent",backgroundClip:"text"}}>
                  Track every trade.
                </span>
                <br/>
                Protect every account.
              </h1>

              <p style={{fontSize:"17px",color:MT,lineHeight:1.7,marginBottom:"36px",maxWidth:"400px"}}>
                The professional trading journal for funded traders. Stay inside your risk rules, review your performance, and never breach a prop firm rule again.
              </p>

              <div style={{display:"flex",flexWrap:"wrap",gap:"12px",marginBottom:"18px"}}>
                <Link href="/login" className="lp-btn" style={{padding:"14px 30px",borderRadius:"12px",background:G,color:"#111",fontSize:"14px",fontWeight:700,boxShadow:"0 0 32px rgba(245,166,35,.4)",textDecoration:"none",display:"inline-flex",alignItems:"center"}}>
                  Get Started Free →
                </Link>
                <Link href="/login" className="lp-ghost" style={{padding:"14px 28px",borderRadius:"12px",background:"transparent",color:TX,fontSize:"14px",fontWeight:600,border:`1px solid ${BD}`,textDecoration:"none",display:"inline-flex",alignItems:"center",transition:"border-color .15s"}}>
                  Sign in
                </Link>
              </div>
              <p style={{fontSize:"12px",color:SB}}>No credit card required · Free forever</p>
            </div>

            {/* App mockup */}
            <div className="lp-mock" style={{display:"flex",justifyContent:"center"}}>
              <div style={{background:S1,border:`1px solid ${BD}`,borderRadius:"20px",padding:"24px",width:"100%",maxWidth:"420px",boxShadow:"0 48px 120px rgba(0,0,0,.75),0 0 0 1px rgba(245,166,35,.04)"}}>

                {/* Stats row */}
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"flex-start",marginBottom:"20px"}}>
                  <div>
                    <div style={{fontSize:"10px",color:SB,textTransform:"uppercase",letterSpacing:".08em",marginBottom:"4px"}}>Net P&amp;L</div>
                    <div style={{fontSize:"30px",fontWeight:800,color:"#22C55E",letterSpacing:"-.04em"}}>+$4,280</div>
                  </div>
                  <div style={{display:"flex",gap:"8px"}}>
                    <div style={{padding:"6px 10px",background:"rgba(245,166,35,.08)",border:"1px solid rgba(245,166,35,.18)",borderRadius:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"14px",fontWeight:700,color:G}}>78%</div>
                      <div style={{fontSize:"9px",color:SB}}>Win Rate</div>
                    </div>
                    <div style={{padding:"6px 10px",background:"rgba(96,165,250,.07)",border:"1px solid rgba(96,165,250,.18)",borderRadius:"8px",textAlign:"center"}}>
                      <div style={{fontSize:"14px",fontWeight:700,color:"#60A5FA"}}>1:2.4</div>
                      <div style={{fontSize:"9px",color:SB}}>Avg R:R</div>
                    </div>
                  </div>
                </div>

                {/* Progress bar */}
                <div style={{marginBottom:"20px"}}>
                  <div style={{display:"flex",justifyContent:"space-between",marginBottom:"6px"}}>
                    <span style={{fontSize:"10px",color:SB,textTransform:"uppercase",letterSpacing:".06em"}}>Apex Funding · Phase 1</span>
                    <span style={{fontSize:"10px",color:G,fontWeight:600}}>71%</span>
                  </div>
                  <div style={{background:"#1E1E1E",borderRadius:"4px",height:"6px",overflow:"hidden"}}>
                    <div style={{width:"71%",background:`linear-gradient(90deg,${G},#F5C842)`,borderRadius:"4px",height:"100%"}}/>
                  </div>
                  <div style={{fontSize:"10px",color:SB,marginTop:"4px"}}>$4,280 of $6,000 profit target</div>
                </div>

                {/* Trade rows */}
                <div style={{borderTop:`1px solid ${BD}`,paddingTop:"16px"}}>
                  <div style={{fontSize:"10px",color:SB,textTransform:"uppercase",letterSpacing:".08em",marginBottom:"10px"}}>Recent Trades</div>
                  {[
                    {symbol:"EUR/USD",sess:"London",  pnl:"+$480",up:true},
                    {symbol:"NAS100", sess:"New York", pnl:"-$120",up:false},
                    {symbol:"GBP/JPY",sess:"London",  pnl:"+$340",up:true},
                    {symbol:"GOLD",   sess:"Asian",   pnl:"+$680",up:true},
                  ].map(t=>(
                    <div key={t.symbol+t.sess} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"7px 10px",borderRadius:"8px",marginBottom:"4px",background:S2}}>
                      <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
                        <span style={{fontSize:"11px",color:t.up?"#22C55E":"#EF4444"}}>{t.up?"▲":"▼"}</span>
                        <div>
                          <div style={{fontSize:"12px",fontWeight:600,color:TX}}>{t.symbol}</div>
                          <div style={{fontSize:"10px",color:SB}}>{t.sess}</div>
                        </div>
                      </div>
                      <div style={{fontSize:"13px",fontWeight:700,color:t.up?"#22C55E":"#EF4444"}}>{t.pnl}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ─── Prop firm band ──────────────────────────────────────── */}
        <div style={{padding:"18px 32px",borderTop:`1px solid ${BD}`,borderBottom:`1px solid ${BD}`}}>
          <div style={{maxWidth:"1060px",margin:"0 auto",textAlign:"center"}}>
            <p style={{fontSize:"11px",color:SB,textTransform:"uppercase",letterSpacing:".1em",marginBottom:"14px"}}>Works with every prop firm</p>
            <div style={{display:"flex",flexWrap:"wrap",justifyContent:"center",gap:"8px 28px"}}>
              {["FTMO","Apex Funding","MyFundedFutures","The5ers","True Forex Funds","Funded Next","E8 Markets","Topstep"].map(f=>(
                <span key={f} style={{fontSize:"13px",fontWeight:600,color:SB}}>{f}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ─── Features ────────────────────────────────────────────── */}
        <section style={{padding:"80px 32px"}}>
          <div style={{maxWidth:"1120px",margin:"0 auto"}}>
            <div style={{textAlign:"center",marginBottom:"56px"}}>
              <h2 style={{fontSize:"clamp(28px,3.5vw,40px)",fontWeight:800,letterSpacing:"-.025em",marginBottom:"12px"}}>
                Everything a serious trader needs
              </h2>
              <p style={{fontSize:"16px",color:MT,maxWidth:"440px",margin:"0 auto",lineHeight:1.65}}>
                Built by a prop trader, for prop traders. Every feature designed around the funded account workflow.
              </p>
            </div>

            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fit,minmax(320px,1fr))",gap:"16px"}}>
              {[
                {icon:"📊",title:"Deep Trade Analytics",   bullets:["Win rate, profit factor, avg R:R","P&L by session, day, instrument","Best and worst performing setups","Monthly performance calendar"]},
                {icon:"🏦",title:"Multi-Account Manager",  bullets:["Evaluation + live accounts in one view","Auto Blown/Passed status from trades","Profit target progress tracking","Withdrawal log for live accounts"]},
                {icon:"📓",title:"Trading Journal",        bullets:["Log every trade with screenshots","Emotion + rule violation tracking","Setup and strategy tagging","Weekend reflection journal"]},
                {icon:"📋",title:"ICT Playbook",           bullets:["Document your full methodology","Reference it while you're live","Keep all strategy notes in one place","Structure your entry rules"]},
                {icon:"📤",title:"CSV Export",             bullets:["Export all trades to CSV","Filter before exporting","Tax-ready format for accountants","Compatible with Excel and Sheets"]},
                {icon:"🏆",title:"Pass Certificates",      bullets:["Upload funded account certificates","Track every firm and phase","Showcase your funded journey","Keep proof of your achievements"]},
              ].map(f=>(
                <div key={f.title} className="lp-card" style={{padding:"28px",borderRadius:"16px",background:S1,border:`1px solid ${BD}`,transition:"border-color .2s"}}>
                  <div style={{fontSize:"26px",marginBottom:"14px"}}>{f.icon}</div>
                  <h3 style={{fontSize:"16px",fontWeight:700,marginBottom:"14px",letterSpacing:"-.01em"}}>{f.title}</h3>
                  <ul style={{listStyle:"none",display:"flex",flexDirection:"column",gap:"8px"}}>
                    {f.bullets.map(b=>(
                      <li key={b} style={{display:"flex",alignItems:"flex-start",gap:"8px",fontSize:"13px",color:MT,lineHeight:1.55}}>
                        <span style={{color:G,marginTop:"1px",flexShrink:0}}>✓</span>{b}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── How it works ────────────────────────────────────────── */}
        <section style={{padding:"64px 32px 80px",background:S1}}>
          <div style={{maxWidth:"900px",margin:"0 auto",textAlign:"center"}}>
            <h2 style={{fontSize:"clamp(26px,3.5vw,36px)",fontWeight:800,letterSpacing:"-.025em",marginBottom:"12px"}}>
              Up and running in minutes
            </h2>
            <p style={{fontSize:"15px",color:MT,marginBottom:"52px",lineHeight:1.65}}>
              No complicated setup. Sign in with Google, add your accounts, start logging trades.
            </p>
            <div className="lp-steps" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"48px"}}>
              {[
                {n:"01",title:"Sign in",body:"Sign in with Google. Your data is private, isolated to your account, and never shared with anyone."},
                {n:"02",title:"Add your accounts",body:"Enter your prop firm evaluation or live account details — starting balance, profit target, and drawdown limits."},
                {n:"03",title:"Log and grow",body:"Log every trade as you take it. Watch your analytics and performance insights build automatically."},
              ].map(s=>(
                <div key={s.n}>
                  <div style={{width:"48px",height:"48px",borderRadius:"50%",margin:"0 auto 18px",background:"rgba(245,166,35,.1)",border:"1px solid rgba(245,166,35,.25)",display:"flex",alignItems:"center",justifyContent:"center",fontSize:"13px",fontWeight:700,color:G}}>
                    {s.n}
                  </div>
                  <h3 style={{fontSize:"16px",fontWeight:700,marginBottom:"10px"}}>{s.title}</h3>
                  <p style={{fontSize:"14px",color:MT,lineHeight:1.65}}>{s.body}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── Stats ───────────────────────────────────────────────── */}
        <section style={{padding:"64px 32px"}}>
          <div style={{maxWidth:"800px",margin:"0 auto"}}>
            <div className="lp-stats" style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"16px"}}>
              {[
                {val:"Free",  label:"Forever. No hidden charges."},
                {val:"∞",     label:"Accounts and trades, no limits."},
                {val:"0",     label:"Data sold. Ever."},
              ].map(s=>(
                <div key={s.label} style={{padding:"32px 20px",textAlign:"center",background:S1,border:`1px solid ${BD}`,borderRadius:"16px"}}>
                  <div style={{fontSize:"36px",fontWeight:800,color:G,letterSpacing:"-.04em",marginBottom:"8px"}}>{s.val}</div>
                  <div style={{fontSize:"13px",color:MT,lineHeight:1.4}}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ─── CTA ─────────────────────────────────────────────────── */}
        <section style={{padding:"20px 32px 80px"}}>
          <div style={{maxWidth:"700px",margin:"0 auto",padding:"64px 40px",borderRadius:"24px",textAlign:"center",background:"linear-gradient(135deg,rgba(245,166,35,.14),rgba(245,166,35,.04))",border:"1px solid rgba(245,166,35,.25)"}}>
            <h2 style={{fontSize:"clamp(26px,3.5vw,36px)",fontWeight:800,letterSpacing:"-.025em",marginBottom:"14px"}}>
              Ready to trade with clarity?
            </h2>
            <p style={{fontSize:"15px",color:MT,marginBottom:"32px",lineHeight:1.65}}>
              Join traders who use TradeLog to track their performance and protect their funded accounts.
            </p>
            <Link href="/login" className="lp-btn" style={{display:"inline-flex",alignItems:"center",justifyContent:"center",padding:"16px 36px",borderRadius:"14px",background:G,color:"#111",fontSize:"15px",fontWeight:700,boxShadow:"0 0 40px rgba(245,166,35,.4)",textDecoration:"none"}}>
              Start Journaling Free →
            </Link>
          </div>
        </section>

        {/* ─── Footer ──────────────────────────────────────────────── */}
        <footer style={{padding:"28px 32px",borderTop:`1px solid ${BD}`}}>
          <div className="lp-foot" style={{maxWidth:"1160px",margin:"0 auto",display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:"12px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"8px"}}>
              <span style={{color:G}}>◈</span>
              <span style={{fontSize:"14px",fontWeight:700}}>TradeLog</span>
              <span style={{fontSize:"13px",color:SB,marginLeft:"8px"}}>© 2026</span>
            </div>
            <div style={{display:"flex",gap:"24px"}}>
              <Link href="/privacy" className="lp-flink" style={{fontSize:"13px",color:SB,textDecoration:"none",transition:"color .15s"}}>Privacy Policy</Link>
              <Link href="/terms"   className="lp-flink" style={{fontSize:"13px",color:SB,textDecoration:"none",transition:"color .15s"}}>Terms of Service</Link>
            </div>
          </div>
        </footer>

      </div>
    </>
  );
}
