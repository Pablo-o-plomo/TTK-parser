# Railway deploy

## Настройки

Build Command:
```bash
npm run build
```

Start Command:
```bash
npm start
```

Railway сам передаёт переменную `$PORT`. В `package.json` старт настроен так:

```bash
vite preview --host 0.0.0.0 --port ${PORT:-3000}
```

## Деплой через GitHub

```bash
git init
git add .
git commit -m "Prepare Railway deploy"
git branch -M main
git remote add origin https://github.com/Pablo-o-plomo/TTK-parser.git
git push -u origin main
```

Потом в Railway: New Project → Deploy from GitHub repo → TTK-parser.
