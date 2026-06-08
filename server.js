const http = require('node:http')
const fs = require('node:fs/promises')
const path = require('node:path')

const PORT = Number(process.env.PORT || 3000)
const DIST_DIR = path.join(__dirname, 'dist')
const OPENAI_RESPONSES_URL = 'https://api.openai.com/v1/responses'
const DEFAULT_OPENAI_MODEL = 'gpt-5.5'
const MAX_BODY_SIZE = 1024 * 1024

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
}

function sendJson(res, statusCode, payload) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  })
  res.end(JSON.stringify(payload))
}

function sendMethodNotAllowed(res) {
  res.writeHead(405, { Allow: 'POST' })
  res.end()
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', chunk => {
      body += chunk
      if (body.length > MAX_BODY_SIZE) {
        reject(new Error('REQUEST_TOO_LARGE'))
        req.destroy()
      }
    })

    req.on('end', () => resolve(body))
    req.on('error', reject)
  })
}

function normalizeText(value) {
  return String(value || '').trim()
}

function normalizeIngredients(ingredients) {
  if (!Array.isArray(ingredients)) return []

  return ingredients
    .map(item => ({
      name: normalizeText(item?.name),
      type: normalizeText(item?.type),
      quantity: normalizeText(item?.quantity),
    }))
    .filter(item => item.name)
}

function normalizeTtkPayload(payload = {}) {
  return {
    title: normalizeText(payload.title),
    yield: normalizeText(payload.yield),
    assemblyTime: normalizeText(payload.assemblyTime),
    category: normalizeText(payload.category),
    dishware: normalizeText(payload.dishware),
    ingredients: normalizeIngredients(payload.ingredients),
  }
}

function makePrompt(ttkData) {
  const ingredientsText = ttkData.ingredients
    .map(item => `- ${item.name} | ${item.type || '—'} | ${item.quantity || '—'}`)
    .join('\n')

  return `Ты — технолог ресторанной сети "Клёво" и бренд-шеф.
На основе данных ТТК создай профессиональные тексты для карточки блюда.

Нужно заполнить:
1. Способ приготовления
2. Стандарт блюда
3. Подача

Правила:
- Пиши на русском языке.
- Стиль: коротко, профессионально, понятно для повара.
- Не добавляй ингредиенты, которых нет в составе.
- Не меняй граммовки.
- Если ингредиент имеет тип "ПФ", считай его готовым полуфабрикатом.
- Не пиши "отварить", "приготовить", "замариновать", если компонент уже ПФ.
- Описывай именно сборку блюда на кухне.
- Не используй художественные длинные описания.
- Не добавляй фантазийные элементы.
- Учитывай посуду, выход, категорию и время сборки.
- Верни строго JSON без markdown.

Формат ответа:
{
  "cookingMethod": "текст",
  "dishStandard": "текст",
  "serving": "текст"
}

Данные блюда:
Название: ${ttkData.title || '—'}
Выход: ${ttkData.yield || '—'}
Время сборки: ${ttkData.assemblyTime || '—'}
Категория: ${ttkData.category || '—'}
Посуда: ${ttkData.dishware || '—'}
Состав:
${ingredientsText}`
}

function extractJsonObject(value) {
  if (!value) return null
  if (typeof value === 'object') return value

  const text = String(value).trim()
  try {
    return JSON.parse(text)
  } catch {
    const match = text.match(/\{[\s\S]*\}/)
    if (!match) return null

    try {
      return JSON.parse(match[0])
    } catch {
      return null
    }
  }
}

function extractResponseText(responseJson) {
  if (responseJson?.output_text) return responseJson.output_text

  const content = responseJson?.output
    ?.flatMap(item => item?.content || [])
    ?.find(item => item?.type === 'output_text' || item?.text)

  return content?.text || ''
}

function normalizeAiResult(value) {
  const parsed = extractJsonObject(value)
  if (!parsed) return null

  const result = {
    cookingMethod: normalizeText(parsed.cookingMethod),
    dishStandard: normalizeText(parsed.dishStandard),
    serving: normalizeText(parsed.serving),
  }

  return result.cookingMethod && result.dishStandard && result.serving ? result : null
}

async function callOpenAi(ttkData) {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    const error = new Error('OPENAI_API_KEY_MISSING')
    error.statusCode = 500
    throw error
  }

  const model = process.env.OPENAI_MODEL || DEFAULT_OPENAI_MODEL
  const response = await fetch(OPENAI_RESPONSES_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      input: makePrompt(ttkData),
      text: {
        format: {
          type: 'json_schema',
          name: 'reference_ttk_text_blocks',
          strict: true,
          schema: {
            type: 'object',
            additionalProperties: false,
            properties: {
              cookingMethod: { type: 'string' },
              dishStandard: { type: 'string' },
              serving: { type: 'string' },
            },
            required: ['cookingMethod', 'dishStandard', 'serving'],
          },
        },
      },
    }),
  })

  const responseText = await response.text()
  const responseJson = extractJsonObject(responseText)

  if (!response.ok) {
    console.error('OpenAI Responses API error', response.status, responseText)
    const error = new Error('OPENAI_REQUEST_FAILED')
    error.statusCode = 502
    throw error
  }

  const result = normalizeAiResult(extractResponseText(responseJson) || responseJson)
  if (!result) {
    const error = new Error('INVALID_AI_RESPONSE')
    error.statusCode = 502
    throw error
  }

  return result
}

async function handleGenerateTtk(req, res) {
  if (req.method !== 'POST') {
    sendMethodNotAllowed(res)
    return
  }

  try {
    const rawBody = await readRequestBody(req)
    const ttkData = normalizeTtkPayload(JSON.parse(rawBody || '{}'))

    if (ttkData.ingredients.length === 0) {
      sendJson(res, 400, { error: 'Добавьте состав блюда перед генерацией' })
      return
    }

    const result = await callOpenAi(ttkData)
    sendJson(res, 200, result)
  } catch (error) {
    if (error.message === 'OPENAI_API_KEY_MISSING') {
      sendJson(res, 500, { error: 'OPENAI_API_KEY не настроен. Добавьте ключ в переменные окружения Railway.' })
      return
    }

    if (error.message === 'INVALID_AI_RESPONSE') {
      sendJson(res, 502, { error: 'AI вернул некорректный ответ' })
      return
    }

    if (error instanceof SyntaxError) {
      sendJson(res, 400, { error: 'Некорректный JSON запроса' })
      return
    }

    console.error(error)
    sendJson(res, error.statusCode || 500, { error: 'Не удалось заполнить ТТК с AI' })
  }
}

async function serveStatic(req, res) {
  const url = new URL(req.url, `http://${req.headers.host || 'localhost'}`)
  const pathname = decodeURIComponent(url.pathname)
  const safePath = path.normalize(pathname).replace(/^\.\.(?:\/|\\|$)/, '')
  const requestedPath = path.join(DIST_DIR, safePath === '/' ? 'index.html' : safePath)

  try {
    const stat = await fs.stat(requestedPath)
    const filePath = stat.isDirectory() ? path.join(requestedPath, 'index.html') : requestedPath
    const ext = path.extname(filePath)
    const content = await fs.readFile(filePath)

    res.writeHead(200, {
      'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
      'Cache-Control': ext === '.html' ? 'no-store' : 'public, max-age=31536000, immutable',
    })
    res.end(content)
  } catch {
    const content = await fs.readFile(path.join(DIST_DIR, 'index.html'))
    res.writeHead(200, { 'Content-Type': MIME_TYPES['.html'], 'Cache-Control': 'no-store' })
    res.end(content)
  }
}

const server = http.createServer((req, res) => {
  if (req.url?.startsWith('/api/generate-ttk')) {
    handleGenerateTtk(req, res)
    return
  }

  serveStatic(req, res)
})

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Academy Klyovo server listening on ${PORT}`)
})
