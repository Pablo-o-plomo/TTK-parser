# Академия Клёво

База знаний ресторанной сети Клёво — аудит и стандартизация ТТК.

## Стек

- React 18 + Vite 5
- Чистый CSS (inline styles, без зависимостей от UI-библиотек)
- Данные: JSON-файлы в `/public/data/`

## Структура

```
src/
├── App.jsx           # Корневой компонент, роутинг, layout
├── constants.js      # Статистика, цвета, иконки, конфиги
├── hooks/
│   └── useData.js    # Загрузка JSON-данных
├── components/
│   ├── ui.jsx        # Tag, Pill, TogBtn, PgBtn, Loading...
│   ├── icons.jsx     # SVG-иконки
│   └── DishModal.jsx # Модальная карточка блюда
└── pages/
    ├── Dashboard.jsx
    ├── Dishes.jsx
    ├── PF.jsx
    ├── Stations.jsx
    ├── Photos.jsx
    ├── Audit.jsx
    └── Attestation.jsx

public/
└── data/
    ├── dishes.json         # 1568 ТТК
    ├── pf.json             # 930 п/ф
    └── discrepancies.json  # 75 расхождений
```

## Локальный запуск

```bash
npm install
npm run dev
# → http://localhost:3000
```

## Деплой на Railway

1. Создай новый проект на [railway.app](https://railway.app)
2. Подключи этот репозиторий через GitHub
3. Railway автоматически определит Node.js/Vite
4. Добавь переменную среды если нужно (не обязательно)
5. Деплой запустится автоматически на каждый push в `main`

Railway использует команды из `package.json`:
- Build: `npm run build`
- Start: `npm run preview` (или настрой Static Site)

## Обновление данных

Для обновления базы блюд — заменить файлы в `public/data/`:
- `dishes.json` — массив ТТК
- `pf.json` — список п/ф  
- `discrepancies.json` — расхождения между ресторанами

## Формат данных

Каждая строка в `dishes.json`:
```
[id, ресторан, название, ttk_номер, дата, категория, станция,
 выход_ед, hasErrors(0/1), errorBits, isShared(0/1), pfCount, pfStr, qcГ]
```

`errorBits`: 1=bruttoMismatch, 2=nettoGtBrutto, 4=readyGtNetto, 8=noIngredients
