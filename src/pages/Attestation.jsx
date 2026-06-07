import { Tag } from '../components/ui.jsx'
import { STA_STATS, SUMMARY } from '../constants.js'

const MODULES = [
  { icon:'📖', title:'Стандарты ТТК',      sub:'Структура карточки, обязательные поля, ГОСТы', lessons:12 },
  { icon:'🔥', title:'Технологии станций', sub:'Горячий цех · Гриль · Суши-бар · Кондитерская', lessons:20 },
  { icon:'⚖️', title:'Контроль выходов',   sub:'Расчёт потерь: уварка, ужарка, запекание', lessons:8 },
  { icon:'📦', title:'Работа с п/ф',       sub:'930 наименований · нормативы · сроки хранения', lessons:10 },
  { icon:'🍽️', title:'Стандарты подачи',   sub:'Фото-эталоны · температуры · визуальный контроль', lessons:15 },
  { icon:'🎓', title:'Финальная аттестация', sub:'Тест бренд-шефа на знание всей базы', lessons:3 },
]

export default function Attestation() {
  return (
    <div>
      <div style={{ background:'linear-gradient(135deg,#0f172a,#312e81)', borderRadius:18, padding:'30px 36px', color:'#fff', marginBottom:24, position:'relative', overflow:'hidden' }}>
        <div style={{ position:'absolute', top:-50, right:-30, width:200, height:200, background:'radial-gradient(circle,#6366f1,transparent 70%)', opacity:.4 }} />
        <div style={{ position:'relative' }}>
          <div style={{ fontSize:10, letterSpacing:3, color:'#818cf8', textTransform:'uppercase', fontWeight:700, marginBottom:8 }}>Академия Клёво</div>
          <h2 style={{ margin:'0 0 8px', fontSize:28, fontWeight:900, letterSpacing:-1 }}>Программа аттестации</h2>
          <p style={{ margin:'0 0 20px', color:'#94a3b8', fontSize:13, maxWidth:500 }}>
            Курс для шефов и технологов на базе реальных ТТК сети. {SUMMARY.totalTTK} рецептур · {Object.keys(STA_STATS).length} станций · 3 ресторана.
          </p>
          <div style={{ display:'flex', gap:10 }}>
            {Object.entries(SUMMARY.restaurants).map(([r, cnt]) => (
              <div key={r} style={{ background:'rgba(255,255,255,.08)', borderRadius:8, padding:'8px 14px' }}>
                <div style={{ fontSize:18, fontWeight:800, color:'#a5b4fc' }}>{cnt}</div>
                <div style={{ fontSize:10, color:'#94a3b8' }}>{r}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(240px,1fr))', gap:12 }}>
        {MODULES.map((m, i) => (
          <div key={i} style={{ background:'#fff', borderRadius:12, padding:'20px', border:'1px solid #e8ecf0', cursor:'pointer', transition:'all .13s' }}
            onMouseEnter={e => e.currentTarget.style.boxShadow='0 4px 18px rgba(0,0,0,.08)'}
            onMouseLeave={e => e.currentTarget.style.boxShadow='none'}
          >
            <div style={{ fontSize:32, marginBottom:10 }}>{m.icon}</div>
            <div style={{ fontSize:15, fontWeight:800, color:'#0f172a', marginBottom:4 }}>{m.title}</div>
            <div style={{ fontSize:11.5, color:'#6b7280', marginBottom:12 }}>{m.sub}</div>
            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <Tag color="#6366f1" bg="#eef2ff" xs>{m.lessons} уроков</Tag>
              <Tag color="#9ca3af" bg="#f3f4f6" xs>В разработке</Tag>
            </div>
            <div style={{ background:'#f3f4f6', borderRadius:6, height:5 }}>
              <div style={{ height:'100%', background:'linear-gradient(90deg,#6366f1,#818cf8)', width:'0%', borderRadius:6 }} />
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
