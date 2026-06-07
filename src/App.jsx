import { cloneElement, isValidElement, useMemo, useState } from 'react'
import { useData } from './hooks/useData.js'
import { useWorkflowStore } from './hooks/useWorkflowStore.js'
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
import { NAV_ITEMS } from './constants.js'
import { NETWORK_RESTAURANTS } from './domain/workflow.js'

import Dashboard   from './pages/Dashboard.jsx'
import Network     from './pages/Network.jsx'
import Dishes      from './pages/Dishes.jsx'
import Comparison  from './pages/Comparison.jsx'
import ReviewTasks from './pages/ReviewTasks.jsx'
import TaskSubmission from './pages/TaskSubmission.jsx'
import Uploads from './pages/Uploads.jsx'
import PF          from './pages/PF.jsx'
import Stations    from './pages/Stations.jsx'
import Photos      from './pages/Photos.jsx'
import Audit       from './pages/Audit.jsx'
import Attestation from './pages/Attestation.jsx'

const NAV_ICONS = {
  dashboard:   GridIcon,
  network:     FireIcon,
  dishes:      BookIcon,
  comparison:  ClipIcon,
  review:      GraduationIcon,
  uploads:     ClipIcon,
  analytics:   GridIcon,
  settings:    GraduationIcon,
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
  const [selectedRestaurant, setSelectedRestaurant] = useState('all')
  const [referenceRestaurant, setReferenceRestaurant] = useState('Петровка')
  const { tasks, manualLinks, uploads, createTask, submitTask, updateTaskStatus, addManualLink, addUpload } = useWorkflowStore()
  const { dishes, pf, disc, loading, error } = useData()

  const restaurantCounts = useMemo(() => dishes.reduce((acc, dish) => {
    acc[dish.restaurant] = (acc[dish.restaurant] || 0) + 1
    return acc
  }, {}), [dishes])

  const visibleDishes = useMemo(() => (
    selectedRestaurant === 'all'
      ? dishes
      : dishes.filter(dish => dish.restaurant === selectedRestaurant)
  ), [dishes, selectedRestaurant])

  const visibleErrors = useMemo(() => visibleDishes.filter(dish => dish.hasErrors).length, [visibleDishes])
  const visibleClean = visibleDishes.length - visibleErrors
  const taskMatch = window.location.pathname.match(/^\/tasks?\/([^/]+)/)
  const taskForRestaurant = taskMatch ? tasks.find(task => task.id === taskMatch[1]) : null

  if (taskMatch) return <TaskSubmission task={taskForRestaurant} submitTask={submitTask} />

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
          <div>Петровка · Ростов · Сочи · Краснодар · Авиапарк</div>
          <div>{dishes.length} ТТК · {pf.length} п/ф</div>
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
          <div style={{ display:'flex', gap:7, alignItems:'center', flexWrap:'wrap', justifyContent:'flex-end' }}>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'#475569' }}>
              Фильтр
              <select
                value={selectedRestaurant}
                onChange={e => setSelectedRestaurant(e.target.value)}
                style={{ border:'1px solid #dbe3ea', borderRadius:10, padding:'7px 10px', fontSize:12, fontWeight:700, color:'#0f172a', background:'#fff', outline:'none' }}
              >
                <option value="all">Все рестораны ({dishes.length})</option>
                {NETWORK_RESTAURANTS.map(restaurant => (
                  <option key={restaurant} value={restaurant}>{restaurant} ({restaurantCounts[restaurant] || 0})</option>
                ))}
              </select>
            </label>
            <label style={{ display:'flex', alignItems:'center', gap:6, fontSize:12, fontWeight:700, color:'#475569' }}>
              Эталон
              <select
                value={referenceRestaurant}
                onChange={e => setReferenceRestaurant(e.target.value)}
                style={{ border:'1px solid #dbe3ea', borderRadius:10, padding:'7px 10px', fontSize:12, fontWeight:700, color:'#0f172a', background:'#fff', outline:'none' }}
              >
                {NETWORK_RESTAURANTS.map(restaurant => <option key={restaurant} value={restaurant}>{restaurant}</option>)}
              </select>
            </label>
            <Tag color="#ef4444" bg="#fef2f2">{Ico.warn} {visibleErrors} ошибок</Tag>
            <Tag color="#16a34a" bg="#f0fdf4">{Ico.check} {visibleClean} чистых</Tag>
          </div>
        </div>

        {/* Content */}
        <div style={{ padding:'22px 26px' }}>
          {section === 'dashboard'   && <Network     dishes={dishes} tasks={tasks} uploads={uploads} referenceRestaurant={referenceRestaurant} createTask={createTask} />}
          {section === 'network'     && <Network     dishes={dishes} tasks={tasks} uploads={uploads} referenceRestaurant={referenceRestaurant} createTask={createTask} />}
          {section === 'dishes'      && <Dishes       dishes={visibleDishes} allDishes={dishes} selectedRestaurant={selectedRestaurant} />}
          {section === 'comparison'  && <Comparison   dishes={dishes} tasks={tasks} manualLinks={manualLinks} addManualLink={addManualLink} createTask={createTask} referenceRestaurant={referenceRestaurant} setReferenceRestaurant={setReferenceRestaurant} />}
          {section === 'review'      && <ReviewTasks  tasks={tasks} updateTaskStatus={updateTaskStatus} />}
          {section === 'uploads'     && <Uploads      uploads={uploads} addUpload={addUpload} dishes={dishes} />}
          {section === 'pf'          && <PF           pf={pf} />}
          {section === 'stations'    && <Stations     dishes={visibleDishes} />}
          {section === 'photos'      && <Photos       dishes={visibleDishes} />}
          {section === 'audit'       && <Audit        dishes={visibleDishes} disc={disc} />}
          {section === 'analytics'   && <Dashboard   dishes={visibleDishes} pf={pf} tasks={tasks} uploads={uploads} go={setSection} />}
          {section === 'settings'    && <Attestation />}
        </div>
      </div>
    </div>
  )
}
