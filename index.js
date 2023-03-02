require('dotenv').config()
const express = require('express')
const axios = require('axios')
const bodyParser = require('body-parser')
const { writeJson, readJson } = require('fs-extra')

const { TOKEN, SERVER_URL, JWT_DOLAR_BLUE } = process.env
const TELEGRAM_API = `https://api.telegram.org/bot${TOKEN}`
const URI = `/webhook/${TOKEN}`
const WEBHOOK_URL = SERVER_URL + URI
const BOT_COMMANDS = [
  { text: '/start', description: 'Saludo cordial', value: 'Saludo cordial' },
  { text: '/hola', description: 'Saludo cordial', value: 'Saludo cordial' },
  { text: '/token', description: 'Token de acceso a la plataforma', value: 'Token de acceso a la plataforma' },
  { text: '/dolarblue', description: 'Cotización dólar blue en este momento', value: 'Cotización dólar blue en este momento' },
  { text: '/undefined', description: 'Mensaje informativo', value: 'Mensaje informativo' },
  { text: '/token-recibed', description: 'Confirma recepción del token', value: '🔑 Token de acceso recibido correctamente'},
]

const app = express()
app.use(bodyParser.json())

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

  const { chatId, message } = await handleResponse({ chat })

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: message
  })

  // TODO: save responses
  return res.send()
})

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
const getAcction = ({ text, botCommands }) => {
  const undefinedAction = botCommands.find(command => command.text === '/undefined')
  if (!text)
    return {
      action: undefinedAction
    }
  
  if (text.includes('/token=')) {
    const action = botCommands.find(command => command.text === '/token-recibed')
    return { action }
  }
  
  const action = botCommands.find(command => command.text === text)
  if (!action)
    return {
      action: undefinedAction
    }
    
  return { action }
}
const executeAction = async ({ action, username, firstName }) => {
  const { text } = action
  let message = `Lo siento, todavía no sé, como responder esa pregunta. Podes consultar el menu de opciones que tengo disponibles, abajo a la izquierda.`

  switch (text) {
    case '/start':
      message = `Bien, para comenzara a operar necesito ingrese tu token de acceso🔑.
        ingresa /token=TU_TOKEN_DE_ACCESO`
      return { message }
    case '/hola':
      message = `Hola ${ firstName || username }, 
        soy un bot 🤖 trader, estoy en desarrollo. 
        🚀 Pronto tendrás más novedades...`
      return { message }
    case '/token':
      message = `🔑 Ingresa tu token de acceso a la plataforma, debería ser algo parecido a esto XXErgW222NohksffsadZrN2055PKxbl_bot.
        Si todavía no tenes tu token de accesso, registrate primero para obtenerlo.`
      return { message }
    case '/token-recibed':
      // TODO: verify token
      message = action.value
      return { message }
    case '/dolarblue':
      const price = await getDolarBluePrice()
      message =  `💵 Cotización dólar blue en este momento: $ ${ price }`
      return { message }
    default:
      return { message }
  }
}
const handleResponse = async ({ chat }) => {
  try {
    if (!chat)
      throw new error

    const chatId = chat.message.chat.id
    const text = chat.message.text
    const { username, first_name: firstName } = chat.message.from
  
    const entities = chat.message.entities
    if (entities)
      console.log('entities', entities)
    
    const { action } = getAcction({ text, botCommands: BOT_COMMANDS })
    const { message } = await executeAction({ action, username, firstName })

    return {
      chatId,
      message
    }
    
  } catch (error) {
    console.error(error)
    const chatId = chat.message.chat.id
    return {
      chatId,
      message: 'Lo siento, todavía no sé, como responder esa pregunta. Podes consultar el menu de opciones que tengo disponibles, abajo a la izquierda.'
    }
  }
}
const getDolarBluePrice = async () => {
  try {
    const config = {
      method: 'get',
      url: 'https://www.safetime.com.ar/api/dolar/currentprice',
      headers: { 
        'Authorization': `Bearer ${JWT_DOLAR_BLUE}`
      }
    }
    const response = await axios(config)
    const { data } = response
    const { price } = data
    return price
  } catch (error) {
    console.log(error)
    return 0
  }
  
}

app.listen(process.env.PORT || 5000, async () => {
  console.log('🚀 app running on port', process.env.PORT || 5000)
  await init()
})