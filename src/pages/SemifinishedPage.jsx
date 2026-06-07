import { useState } from 'react'

export default function SemifinishedPage() {
  const [items, setItems] = useState([])

  const [form, setForm] = useState({
    name: '',
    unit: 'г',
    output: '',
    category: '',
    categoryPath: '',
    composition: '',
    cookingMethod: '',
    description: '',
  })

  function change(field, value) {
    setForm({
      ...form,
      [field]: value,
    })
  }

  function save() {
    if (!form.name.trim()) {
      alert('Введите название полуфабриката')
      return
    }

    setItems([
      {
        id: Date.now(),
        ...form,
      },
      ...items,
    ])

    setForm({
      name: '',
      unit: 'г',
      output: '',
      category: '',
      categoryPath: '',
      composition: '',
      cookingMethod: '',
      description: '',
    })
  }

  return (
    <div style={{ padding: 20 }}>

      <h1>🥣 Полуфабрикаты</h1>

      <div
        style={{
          display: 'grid',
          gap: 10,
          maxWidth: 900,
          marginBottom: 30,
        }}
      >

        <input
          placeholder="Название"
          value={form.name}
          onChange={(e) => change('name', e.target.value)}
        />

        <input
          placeholder="Единица измерения"
          value={form.unit}
          onChange={(e) => change('unit', e.target.value)}
        />

        <input
          placeholder="Выход"
          value={form.output}
          onChange={(e) => change('output', e.target.value)}
        />

        <input
          placeholder="Категория"
          value={form.category}
          onChange={(e) => change('category', e.target.value)}
        />

        <input
          placeholder="Путь категории"
          value={form.categoryPath}
          onChange={(e) => change('categoryPath', e.target.value)}
        />

        <textarea
          rows={5}
          placeholder="Состав"
          value={form.composition}
          onChange={(e) => change('composition', e.target.value)}
        />

        <textarea
          rows={6}
          placeholder="Способ приготовления"
          value={form.cookingMethod}
          onChange={(e) => change('cookingMethod', e.target.value)}
        />

        <textarea
          rows={4}
          placeholder="Описание"
          value={form.description}
          onChange={(e) => change('description', e.target.value)}
        />

        <button onClick={save}>
          Сохранить полуфабрикат
        </button>

      </div>

      <hr />

      <h2>Список полуфабрикатов</h2>

      <table
        style={{
          width: '100%',
          borderCollapse: 'collapse',
        }}
      >

        <thead>

          <tr>

            <th>Название</th>

            <th>Выход</th>

            <th>Категория</th>

            <th>Группа</th>

          </tr>

        </thead>

        <tbody>

          {items.map((item) => (

            <tr key={item.id}>

              <td>{item.name}</td>

              <td>{item.output}</td>

              <td>{item.category}</td>

              <td>{item.categoryPath}</td>

            </tr>

          ))}

        </tbody>

      </table>

    </div>
  )
}