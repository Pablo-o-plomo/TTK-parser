export const Tag = ({ children, color = '#6366f1', bg, xs }) => (
  <span style={{
    display:'inline-flex',alignItems:'center',whiteSpace:'nowrap',
    padding: xs?'2px 7px':'3px 9px', borderRadius:20,
    background: bg||color+'18', color, fontSize:xs?10:11, fontWeight:700, letterSpacing:.3,
  }}>{children}</span>
)

export const Pill = ({ v, label, color, icon }) => (
  <div style={{background:'#fff',border:'1px solid #e8ecf0',borderRadius:12,padding:'16px 18px',display:'flex',flexDirection:'column',gap:4}}>
    <div style={{fontSize:24}}>{icon}</div>
    <div style={{fontSize:28,fontWeight:800,color,lineHeight:1,letterSpacing:-1}}>{v}</div>
    <div style={{fontSize:11,fontWeight:700,color:'#374151',textTransform:'uppercase',letterSpacing:.5}}>{label}</div>
  </div>
)

export const TogBtn = ({ children, active, onClick, color }) => (
  <button onClick={onClick} style={{
    padding:'8px 14px',borderRadius:10,border:`1.5px solid ${active?color:'#e5e7eb'}`,
    background:active?color+'18':'#fff',color:active?color:'#6b7280',
    fontSize:12,fontWeight:600,cursor:'pointer',transition:'all .12s',
  }}>{children}</button>
)

export const PgBtn = ({ children, onClick, dis, active }) => (
  <button onClick={onClick} disabled={dis} style={{
    padding:'8px 14px',borderRadius:8,border:`1.5px solid ${active?'#6366f1':'#e5e7eb'}`,
    background:active?'#eef2ff':'#fff',color:active?'#4f46e5':dis?'#d1d5db':'#374151',
    cursor:dis?'not-allowed':'pointer',fontSize:12.5,fontWeight:active?700:400,opacity:dis?.4:1,
  }}>{children}</button>
)

export const SEL_ST = {
  padding:'8px 12px',border:'1.5px solid #e5e7eb',borderRadius:10,
  fontSize:12,outline:'none',background:'#fff',cursor:'pointer',
}

export const selSt = SEL_ST

export const Loading = ({ text = 'Загрузка…' }) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:16}}>
    <div style={{fontSize:40}}>⏳</div>
    <div style={{fontSize:14,color:'#6b7280'}}>{text}</div>
  </div>
)

export const ErrorScreen = ({ msg }) => (
  <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:'60vh',flexDirection:'column',gap:12}}>
    <div style={{fontSize:36}}>❌</div>
    <div style={{fontSize:14,color:'#ef4444',fontWeight:700}}>Ошибка загрузки</div>
    <div style={{fontSize:12,color:'#9ca3af'}}>{msg}</div>
  </div>
)
