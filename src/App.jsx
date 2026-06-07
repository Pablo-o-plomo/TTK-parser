import { cloneElement, isValidElement, useState } from 'react'
import { useData } from './hooks/useData.js'
import { Loading, ErrorScreen, Tag } from './components/ui.jsx'
import {
  BookIcon,
  BowlIcon,
  CameraIcon,
  ClipIcon,
  FireIcon,
  GraduationIcon,
  GridIcon,
  Ico,
} from './components/icons.jsx'
import { NAV_ITEMS, SUMMARY } from './constants.js'

import Dashboard   from './pages/Dashboard.jsx'
import Dishes      from './pages/Dishes.jsx'
import PF          from './pages/PF.jsx'
import Stations    from './pages/Stations.jsx'
import Photos      from './pages/Photos.jsx'
import Audit       from './pages/Audit.jsx'
import Attestation from './pages/Attestation.jsx'

const NAV_ICONS = {
  dashboard:   GridIcon,
  dishes:      BookIcon,
  pf:          BowlIcon,
  stations:    FireIcon,
  photos:      CameraIcon,
  audit:       ClipIcon,
  attestation: GraduationIcon,
}

function SafeIcon({ icon: Icon, ...props }) {
  if (typeof Icon === 'function') return <Icon {...props} />
  if (isValidElement(Icon)) return cloneElement(Icon, props)
  return null
}

export default function App() {
  const [section, setSection] = useState('dashboard')
  const { dishes, pf, disc, loading, error } = useData()

  if (loading) return <Loading />
  if (error)   return <ErrorScreen msg={error} />

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'#f8fafc' }}>

      {/* ── Sidebar ── */}
      <div style={{ width:216, background:'#0f172a', display:'flex', flexDirection:'column', flexShrink:0, position:'sticky', top:0, height:'100vh', overflowY:'auto' }}>
        <div style={{ padding:'22px 18px 18px', borderBottom:'1px solid rgba(255,255,255,.08)' }}>
          <div style={{ fontSize:21, fontWeight:900, color:'#fff', letterSpacing:-1, lineHeight:1 }}>Академия</div>
          <div style={{ fontSize:12, fontWeight:800, color:'#6366f1', letterSpacing:3, textTransform:'uppercase', marginTop:2 }}>Клёво</div>
          <div style={{ marginTop:8, fontSize:9, color:'rgba(255,255,255,.25)', letterSpacing:1 }}>v1.0 · База знаний сети</div>
        </div>

        <nav style={{ flex:1, padding:'10px 8px' }}>
          {NAV_ITEMS.map(n => {
            const active = section === n.id
            const NavIcon = NAV_ICONS[n.id]
            return (
              <button key={n.id} onClick={() => setSection(n.id)} style={{
                width:'100%', display:'flex', alignItems:'center', gap:9, padding:'9px 11px',
                borderRadius:8, border:'none', cursor:'pointer', marginBottom:1,
                background: active ? '#6366f1' : 'transparent',
                color: active ? '#fff' : '#94a3b8',
                fontSize:13, fontWeight: active ? 700 : 500, textAlign:'left',
                transition:'all .1s',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background='rgba(255,255,255,.06)'; e.currentTarget.style.color='#e2e8f0' }}}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background='transparent'; e.currentTarget.style.color='#94a3b8' }}}
              >
                <span style={{ opacity: active ? 1 : .8, flexShrink:0 }}><SafeIcon icon={NavIcon} /></span>
                <span style={{ flex:1 }}>{n.label}</span>
                {n.badge != null && (
                  <span style={{
                    background: n.badgeRed ? '#ef4444' : active ? 'rgba(255,255,255,.25)' : 'rgba(255,255,255,.1)',
                    color:'#fff', fontSize:10, fontWeight:700, padding:'1px 7px', borderRadius:10,
                  }}>{n.badge}</span>
                )}
              </button>
            )
          })}
        </nav>

        <div style={{ padding:'12px 14px', borderTop:'1px solid rgba(255,255,255,.07)', fontSize:10, color:'#334155', lineHeight:1.7 }}>
          <div>РОСТОВ · САХАЛИН · СОЧИ</div>
          <div>{SUMMARY.totalTTK} ТТК · {pf.length} п/ф</div>
          <div>Аудит: июнь 2026</div>
        </div>
      </div>

      {/* ── Main ── */}
      <div style={{ flex:1, overflow:'auto', minWidth:0 }}>

        {/* Topbar */}
        <div style={{ background:'#fff', borderBottom:'1px solid #e8ecf0', padding:'14px 26px', display:'flex', alignItems:'center', justifyContent:'space-between', position:'sticky', top:0, zIndex:100 }}>
          <div style={{ fontSize:16, fontWeight:800, color:'#0f172a' }}>
            {NAV_ITEMS.find(n => n.id === section)?.label}
          </div>
          <div style={{ display:'flex', gap:7 }}>
            <Tag color="#ef4444" bg="#fef2f2">{Ico.warn} {SUMMARY.withErrors} ошибок</Tag>
            <Tag color="#16a34a" bg="#f0fdf4">{Ico.check} {SUMMARY.cleanTTK} чистых</Tag>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'22px 26px' }}>
          {section === 'dashboard'   && <Dashboard   dishes={dishes} pf={pf} go={setSection} />}
          {section === 'dishes'      && <Dishes       dishes={dishes} />}
          {section === 'pf'          && <PF           pf={pf} />}
          {section === 'stations'    && <Stations     dishes={dishes} />}
          {section === 'photos'      && <Photos       dishes={dishes} />}
          {section === 'audit'       && <Audit        dishes={dishes} disc={disc} />}
          {section === 'attestation' && <Attestation />}
        </div>
      </div>
    </div>
  )
}
