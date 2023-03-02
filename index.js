require('dotenv').config()
const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')
const { writeJson, readJson } = require('fs-extra')

const { TOKEN, SERVER_URL } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`
const URI = `/webhook/${TOKEN}`
const WEBHOOK_URL = SERVER_URL + URI

const app = express()
app.use(bodyParser.json())

const appendNewChat = async ({ path, chat }) => {
  try {
    path = path || './data/chats.json'
    const dataReaded = await readJson(path)
    const data = [...dataReaded, chat]

    await writeJson(path, data)
    console.log('Data written successfully!')
  } catch (error) {
    console.log(error)
  }
}

const init = async () => {
  const res = await axios.get(`${TELEGRAM_API}/setWebhook?url=${WEBHOOK_URL}`)
  console.log(res.data)
}

app.get('/', (req, res) => {
  return res.send("It's alive!")
})

app.post(URI, async (req, res) => {
  const chat = { ...req.body }
  console.log(chat)
  appendNewChat({ chat })

  const { chatId, message } = handleResponse({ chat })

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: message
  })
  return res.send()
})

const botCommands = [
  { text: '/hi', description: 'Saludo cordial' },
  { text: '/token', description: 'Token de acceso a la plataforma' },
  { text: '/dolarblue', description: 'Cotización dólar blue en este momento' },
  { text: '/undefined', description: 'Mensaje informativo' },
]

const getAcction = ({ text, botCommands }) => {
  const undefinedAction = botCommands.find(command => command.text === '/undefined')
  if (!text)
    return {
      action: undefinedAction
    }
  
  const action = botCommands.find(command => command.text === text)
  if (!action)
    return {
      action: undefinedAction
    }
    
  return { action }
}
const executeAction = ({ action, username, firstName }) => {
  const { text } = action
  let message = `Hola ${ firstName || username }, 
  soy un bot 🤖 trader, estoy en desarrollo. 
  🚀 Pronto tendrás más novedades...`

  switch (text) {
    case '/hi':
      return { message }
    case '/token':
      message = `🔑 Ingresa tu token de acceso a la plataforma, debería ser algo parecido a esto XXErgW222NohksffsadZrN2055PKxbl_bot.
      Si todavía no tenes tu tocken de accesso, registrate primero para obtenerlo.`
      return { message }
    case '/dolarblue':
      message =  `💵 Cotización dólar blue en este momento: $ 150`
      return { message }
    default:
      return { message }
  }
}

const handleResponse = ({ chat }) => {
  try {
    if (!chat)
      throw new error

    const chatId = chat.message.chat.id
    const text = chat.message.text
    const { username, first_name: firstName } = chat.message.from
  
    const entities = chat.message.entities
    if (entities)
      console.log('entities', entities)
    
    const { action } = getAcction({ text, botCommands })
    const { message } = executeAction({ action, username, firstName })

    return {
      chatId,
      message
    }
    
  } catch (error) {
    const chatId = chat.message.chat.id
    return {
      chatId,
      message: 'Lo siento, todavía no sé, como responder esa pregunta.'
    }
  }
}

app.post('/api/v1/send-message', async (req, res) => {
  const { message, chatId } = req.body

  if (!message || !chatId)
    return res.status(400).send({
      message: 'Message or chatId is missing!'
    })

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: message
  })
  return res.status(200).send({
    message: 'Message sent successfully!'
  })
})

app.listen(process.env.PORT || 5000, async () => {
  console.log('🚀 app running on port', process.env.PORT || 5000)
  await init()
})