import { useState, useEffect } from 'react'
import { Tag } from './ui.jsx'
import { Ico } from './icons.jsx'
import { REST_COLOR, REST_BG, CAT_ICONS, STA_ICONS, ERR_LABELS, PHOTO_SLOTS } from '../constants.js'

function errBitsToList(bits) {
  return [1, 2, 4, 8].filter(b => bits & b).map(b => ERR_LABELS[b])
}

const STATUS_LABELS = ['Черновик', 'На ревизии', 'Утверждено']
const STATUS_COLORS = ['#6366f1', '#d97706', '#16a34a']

export default function DishModal({ dish, onClose }) {
  const [photoSlot, setPhotoSlot] = useState(0)
  const [stdStatus, setStdStatus] = useState(0)
  const errs = errBitsToList(dish.errorBits)
  const extras = dish.extras || {}
  const ingredients = Array.isArray(extras.ingredients) ? extras.ingredients : dish.components || []
  const photos = Array.isArray(extras.photos)
    ? extras.photos
    : typeof extras.photos === 'string'
      ? extras.photos.split(/[|;,\n]/).map(src => src.trim()).filter(Boolean)
      : []

  useEffect(() => {
    const h = e => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', h)
    return () => window.removeEventListener('keydown', h)
  }, [onClose])

  return (
    <div
      style={{ position:'fixed', inset:0, background:'rgba(0,0,0,.6)', zIndex:2000,
        display:'flex', alignItems:'center', justifyContent:'center', padding:16 }}
      onClick={onClose}
    >
      <div
        style={{ background:'#fff', borderRadius:20, width:'100%', maxWidth:740,
          maxHeight:'92vh', overflowY:'auto', boxShadow:'0 24px 80px rgba(0,0,0,.3)' }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div style={{ padding:'22px 26px 16px', borderBottom:'1px solid #f0f0f0',
          position:'sticky', top:0, background:'#fff', zIndex:10 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:12 }}>
            <div style={{ flex:1 }}>
              <div style={{ fontSize:9, letterSpacing:2.5, color:'#9ca3af',
                textTransform:'uppercase', fontWeight:700, marginBottom:4 }}>
                ТТК №{dish.ttk} · {dish.date}
              </div>
              <h2 style={{ margin:0, fontSize:19, fontWeight:900, color:'#0f172a', lineHeight:1.2 }}>{dish.name}</h2>
            </div>
            <button onClick={onClose} style={{ background:'#f3f4f6', border:'none',
              borderRadius:8, padding:'7px 9px', cursor:'pointer', color:'#6b7280', flexShrink:0 }}>
              {Ico.close}
            </button>
          </div>
          <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginTop:10 }}>
            <Tag color={REST_COLOR[dish.restaurant] || '#6366f1'} bg={REST_BG[dish.restaurant] || '#eef2ff'}>{dish.restaurant}</Tag>
            <Tag color="#374151" bg="#f3f4f6">{CAT_ICONS[dish.category] || '🍴'} {dish.category}</Tag>
            <Tag color="#0891b2" bg="#e0f2fe">{STA_ICONS[dish.station] || '🏷️'} {dish.station}</Tag>
            {dish.isShared && <Tag color="#7c3aed" bg="#f5f3ff">↔ Кросс-сеть</Tag>}
            <Tag color={dish.hasErrors ? '#ef4444' : '#16a34a'} bg={dish.hasErrors ? '#fef2f2' : '#f0fdf4'}>
              {dish.hasErrors ? '⚠ Требует проверки' : '✓ Чистая ТТК'}
            </Tag>
          </div>
        </div>

        <div style={{ padding:'20px 26px', display:'flex', flexDirection:'column', gap:18 }}>

          {/* Stats row */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              ['Выход',  dish.qcG ? `${dish.qcG} г` : `${dish.output} ед.`, '#6366f1'],
              ['П/Ф',    dish.pfCount > 0 ? `${dish.pfCount} позиций` : 'Нет', '#7c3aed'],
              ['Статус', STATUS_LABELS[stdStatus], STATUS_COLORS[stdStatus]],
            ].map(([l, v, c]) => (
              <div key={l} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:10, color:'#9ca3af', textTransform:'uppercase', fontWeight:600, letterSpacing:.5 }}>{l}</div>
                <div style={{ fontSize:17, fontWeight:800, color:c, marginTop:3 }}>{v}</div>
              </div>
            ))}
          </div>

          {/* PF list */}
          {dish.pfList.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>📦 Полуфабрикаты</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {dish.pfList.map((p, i) => <Tag key={i} color="#7c3aed" bg="#f5f3ff" xs>📦 {p}</Tag>)}
              </div>
            </div>
          )}

          {/* Technology + plating */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
            {[
              ['🧑‍🍳 Технология приготовления', extras.technology],
              ['🍽️ Описание подачи', extras.description],
            ].map(([lbl, value]) => (
              <div key={lbl} style={{ background:'#fffbeb', border:'1.5px dashed #fbbf24', borderRadius:10, padding:'14px 16px' }}>
                <div style={{ fontSize:11, fontWeight:700, color:'#92400e', marginBottom:5 }}>{lbl}</div>
                <div style={{ fontSize:11, color:'#b45309', fontStyle: value ? 'normal' : 'italic', whiteSpace:'pre-wrap', lineHeight:1.5 }}>
                  {value || 'Требуется описание бренд-шефом'}
                </div>
              </div>
            ))}
          </div>

          {ingredients.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>🥗 Ингредиенты / состав</div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {ingredients.map((item, i) => <Tag key={i} color="#0891b2" bg="#e0f2fe" xs>{item}</Tag>)}
              </div>
            </div>
          )}

          {/* QC */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Контроль качества</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:8 }}>
              {[
                ['⚖️ Выход',              dish.qcG ? `${dish.qcG} г` : '—'],
                ['🌡️ Температура подачи', 'Требует заполнения'],
                ['👁️ Визуальный контроль', 'Требует заполнения'],
              ].map(([l, v]) => (
                <div key={l} style={{ background:'#f9fafb', border:'1px solid #e5e7eb', borderRadius:8, padding:'10px 12px' }}>
                  <div style={{ fontSize:10, color:'#9ca3af', fontWeight:600, marginBottom:3 }}>{l}</div>
                  <div style={{ fontSize:12, fontWeight:600, color: v.includes('Требует') ? '#d97706' : '#111827' }}>{v}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Photo control */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>📸 Фото-контроль (5 ракурсов)</div>
            <div style={{ display:'flex', gap:6, flexWrap:'wrap', marginBottom:10 }}>
              {PHOTO_SLOTS.map((s, i) => (
                <button key={s.id} onClick={() => setPhotoSlot(i)} style={{
                  padding:'6px 11px', borderRadius:8,
                  border:`1.5px solid ${photoSlot === i ? '#6366f1' : '#e5e7eb'}`,
                  background: photoSlot === i ? '#eef2ff' : '#fff', cursor:'pointer', fontSize:11,
                  color: photoSlot === i ? '#4f46e5' : '#6b7280',
                  fontWeight: photoSlot === i ? 700 : 400,
                }}>
                  {s.icon} {s.label}
                </button>
              ))}
            </div>
            <div style={{ background:'#f3f4f6', borderRadius:12, height:120, display:'flex',
              flexDirection:'column', alignItems:'center', justifyContent:'center',
              border:'2px dashed #d1d5db', gap:6 }}>
              <div style={{ fontSize:32 }}>📷</div>
              <div style={{ fontSize:12, fontWeight:700, color:'#6b7280' }}>
                Фото {photoSlot + 1}: {PHOTO_SLOTS[photoSlot].desc}
              </div>
              <div style={{ fontSize:10, color:'#9ca3af' }}>{photos.length > 0 ? `${photos.length} фото в данных блюда` : 'Загрузить эталонное фото'}</div>
            </div>
          </div>

          {photos.length > 0 && (
            <div>
              <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>🖼️ Фото из ТТК</div>
              <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(120px,1fr))', gap:8 }}>
                {photos.map((src, i) => (
                  <a key={i} href={src} target="_blank" rel="noreferrer" style={{ color:'#2563eb', fontSize:11, wordBreak:'break-word' }}>{src}</a>
                ))}
              </div>
            </div>
          )}

          {/* Tech errors */}
          {errs.length > 0 && (
            <div style={{ background:'#fff7ed', border:'1px solid #fed7aa', borderRadius:10, padding:'14px 16px' }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#92400e', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
                {Ico.warn} Технологические ошибки в ТТК
              </div>
              <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                {errs.map((e, i) => <Tag key={i} color="#d97706" bg="#fffbeb" xs>⚠ {e}</Tag>)}
              </div>
            </div>
          )}

          {/* Missing fields */}
          <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:10, padding:'14px 16px' }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#991b1b', display:'flex', alignItems:'center', gap:6, marginBottom:8 }}>
              {Ico.warn} Требует заполнения бренд-шефом
            </div>
            <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
              {['Технология', 'Подача', 'Температура', 'Визуал-контроль',
                'Фото: сверху', 'Фото: 45°', 'Фото: крупный план', 'Фото: вес', 'Фото: подача'
              ].map((f, i) => <Tag key={i} color="#dc2626" bg="#fee2e2" xs>⚠ {f}</Tag>)}
            </div>
          </div>

          {/* Standard status */}
          <div>
            <div style={{ fontSize:11, fontWeight:700, color:'#374151', textTransform:'uppercase', letterSpacing:.5, marginBottom:8 }}>Статус стандарта</div>
            <div style={{ display:'flex', gap:8 }}>
              {STATUS_LABELS.map((s, i) => (
                <button key={s} onClick={() => setStdStatus(i)} style={{
                  flex:1, padding:'10px 0', borderRadius:9, fontSize:12, fontWeight:700, cursor:'pointer',
                  border:`2px solid ${stdStatus === i ? STATUS_COLORS[i] : '#e5e7eb'}`,
                  background: stdStatus === i ? STATUS_COLORS[i] + '18' : '#fff',
                  color: stdStatus === i ? STATUS_COLORS[i] : '#9ca3af',
                  transition:'all .12s',
                }}>{i === 2 ? '✓ ' : ''}{s}</button>
              ))}
            </div>
          </div>

        </div>
      </div>
    </div>
  )
}
