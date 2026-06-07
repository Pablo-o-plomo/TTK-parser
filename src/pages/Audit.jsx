import { useState, useMemo } from 'react'
import { Tag } from '../components/ui.jsx'
import { Ico } from '../components/icons.jsx'
import { REST_COLOR, REST_BG, SUMMARY } from '../constants.js'

export default function Audit({ dishes, disc }) {
  const [tab, setTab] = useState('errors')
  const errDishes = useMemo(() => dishes.filter(d => d.hasErrors), [dishes])

  const ERR_TYPES = [
    { bit:1, label:'Брутто ед.изм. ≠ Брутто кг', count: SUMMARY.bruttoMismatch, sev:'КРИТИЧЕСКАЯ',
      hint:'Единица измерения ингредиента не соответствует весу в кг. Проверить коэффициент перевода.' },
    { bit:2, label:'Нетто > Брутто (невозможно)', count: SUMMARY.nettoGtBrutto, sev:'КРИТИЧЕСКАЯ',
      hint:'Нетто не может быть больше брутто — критическая ошибка в карте.' },
    { bit:4, label:'Готово > Нетто (рост массы)', count: SUMMARY.readyGtNetto, sev:'СРЕДНЯЯ',
      hint:'Допустимо для пасты, бобовых, круп. Требует подтверждения технологом.' },
    { bit:8, label:'ТТК без ингредиентов', count: SUMMARY.noIngredients, sev:'СРЕДНЯЯ',
      hint:'Нет состава — невозможно рассчитать себестоимость и провести аудит.' },
  ]

  return (
    <div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginBottom:22 }}>
        {[
          ['⚠️','ТТК с ошибками',     SUMMARY.withErrors,         '#ef4444'],
          ['↔️','Кросс-расхождений', SUMMARY.crossDiscrepancies,  '#7c3aed'],
          ['✅','Чистых ТТК',         SUMMARY.cleanTTK,           '#16a34a'],
          ['🔢','Брутто-ошибки',      SUMMARY.bruttoMismatch,     '#d97706'],
        ].map(([i,l,v,c]) => (
          <div key={l} style={{ background:'#fff', border:'1px solid #e8ecf0', borderRadius:12, padding:'16px', textAlign:'center' }}>
            <div style={{ fontSize:22 }}>{i}</div>
            <div style={{ fontSize:26, fontWeight:800, color:c, lineHeight:1.1 }}>{v}</div>
            <div style={{ fontSize:10.5, color:'#9ca3af', marginTop:3 }}>{l}</div>
          </div>
        ))}
      </div>

      <div style={{ display:'flex', gap:6, marginBottom:18, borderBottom:'2px solid #f0f0f0' }}>
        {[
          ['errors', '⚠ Ошибки ТТК',                   errDishes.length],
          ['disc',   '↔ Расхождения между ресторанами', SUMMARY.crossDiscrepancies],
          ['missing','📋 Отсутствующие данные',           SUMMARY.totalTTK],
        ].map(([id, label, cnt]) => (
          <button key={id} onClick={() => setTab(id)} style={{
            padding:'9px 16px', border:'none',
            borderBottom:`2.5px solid ${tab===id ? '#ef4444' : 'transparent'}`,
            background:'transparent', cursor:'pointer', fontSize:12.5,
            fontWeight: tab===id ? 700 : 500, color: tab===id ? '#ef4444' : '#6b7280', marginBottom:-2,
          }}>
            {label} <span style={{ opacity:.6 }}>({cnt})</span>
          </button>
        ))}
      </div>

      {tab === 'errors' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {ERR_TYPES.map(({ bit, label, count, sev, hint }) => {
            const affected = errDishes.filter(d => d.errorBits & bit)
            const isCrit = sev === 'КРИТИЧЕСКАЯ'
            return (
              <div key={bit} style={{ background:'#fff', border:`1px solid ${isCrit ? '#fecaca' : '#fed7aa'}`, borderRadius:12, overflow:'hidden' }}>
                <div style={{ display:'flex', alignItems:'center', gap:12, padding:'14px 18px', background: isCrit ? '#fef2f2' : '#fff7ed' }}>
                  <div style={{ background:'#fff', borderRadius:8, padding:'6px 12px', minWidth:52, textAlign:'center', border:`1px solid ${isCrit ? '#fecaca' : '#fed7aa'}` }}>
                    <div style={{ fontSize:20, fontWeight:900, color: isCrit ? '#ef4444' : '#d97706' }}>{count}</div>
                    <div style={{ fontSize:9, color:'#9ca3af' }}>ТТК</div>
                  </div>
                  <div style={{ flex:1 }}>
                    <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{label}</div>
                    <div style={{ fontSize:11, color:'#6b7280' }}>{hint}</div>
                  </div>
                  <Tag color={isCrit ? '#ef4444' : '#d97706'} bg={isCrit ? '#fef2f2' : '#fffbeb'}>{sev}</Tag>
                </div>
                {affected.length > 0 && (
                  <div style={{ padding:'10px 18px', background:'#fff' }}>
                    <div style={{ fontSize:10.5, color:'#9ca3af', marginBottom:6 }}>Примеры:</div>
                    <div style={{ display:'flex', gap:5, flexWrap:'wrap' }}>
                      {affected.slice(0, 8).map(d => (
                        <Tag key={d.id} color={REST_COLOR[d.restaurant]} bg={REST_BG[d.restaurant]} xs>
                          {d.name.slice(0,35)}{d.name.length>35?'…':''}
                        </Tag>
                      ))}
                      {affected.length > 8 && <Tag color="#6b7280" bg="#f3f4f6" xs>… +{affected.length - 8}</Tag>}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      )}

      {tab === 'disc' && (
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {disc.map((d, i) => (
            <div key={i} style={{ background:'#fff', border:'2px solid #fecaca', borderRadius:12, overflow:'hidden' }}>
              <div style={{ background:'#fef2f2', padding:'11px 16px', display:'flex', alignItems:'center', justifyContent:'space-between', gap:10 }}>
                <div style={{ fontWeight:700, color:'#991b1b', fontSize:13, flex:1, textTransform:'capitalize' }}>{d.name}</div>
                <div style={{ display:'flex', gap:6 }}>
                  {d.rests.map(r => <Tag key={r} color={REST_COLOR[r]} bg={REST_BG[r]} xs>{r}</Tag>)}
                  {d.outputDiff && <Tag color="#ef4444" bg="#fef2f2" xs>разный выход</Tag>}
                </div>
              </div>
              <div style={{ padding:'12px 16px', display:'grid', gridTemplateColumns:`repeat(${d.rests.length},1fr)`, gap:12 }}>
                {d.rests.map(r => {
                  const missing = (d.missing || {})[r] || []
                  return (
                    <div key={r}>
                      <div style={{ fontSize:10, fontWeight:700, color:REST_COLOR[r], textTransform:'uppercase', marginBottom:5 }}>
                        Нет в {r} ({missing.length}):
                      </div>
                      {missing.slice(0, 5).map((ing, j) => (
                        <div key={j} style={{ fontSize:11, color:'#374151', padding:'2px 0', display:'flex', gap:5 }}>
                          <span style={{ color:'#ef4444' }}>✕</span> {ing}
                        </div>
                      ))}
                      {missing.length > 5 && <div style={{ fontSize:10, color:'#9ca3af', marginTop:3 }}>… ещё {missing.length - 5}</div>}
                    </div>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {tab === 'missing' && (
        <div style={{ background:'#fef2f2', border:'1px solid #fecaca', borderRadius:12, padding:'18px 22px' }}>
          <div style={{ fontSize:13, fontWeight:700, color:'#991b1b', marginBottom:12 }}>
            Все {SUMMARY.totalTTK} ТТК требуют дополнения бренд-шефом
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:10 }}>
            {[
              ['🧑‍🍳 Технология',    'Описание процесса приготовления'],
              ['🍽️ Подача',          'Описание подачи блюда гостю'],
              ['📸 Фото (×5)',        '7840 фото · 5 ракурсов × 1568 блюд'],
              ['🌡️ Температура',     'Температура подачи / хранения'],
              ['👁️ Визуал-контроль', 'Описание внешнего вида эталона'],
              ['✅ Статус стандарта','Ни одна ТТК не утверждена бренд-шефом'],
            ].map(([l, hint]) => (
              <div key={l} style={{ background:'#fff', border:'1px solid #fecaca', borderRadius:10, padding:'12px 14px' }}>
                <div style={{ fontSize:13, fontWeight:700, color:'#0f172a', marginBottom:3 }}>{l}</div>
                <div style={{ fontSize:10.5, color:'#6b7280', marginBottom:6 }}>{hint}</div>
                <Tag color="#ef4444" bg="#fee2e2" xs>Нужно для {SUMMARY.totalTTK} ТТК</Tag>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
