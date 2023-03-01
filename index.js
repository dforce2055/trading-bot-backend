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
  console.log(req.body)

  const chat = req.body.message.chat.id
  appendNewChat({ chat })

  const chatId = req.body.message.chat.id
  const text = req.body.message.text
  const { username, first_name: firstName } =  req.body.message.from
  const message = `👋 Hola ${firstName || username }. 
  Soy un bot 🤖 trader, todavía no estoy listo, pero mi *Amo* 🤓 me esta terminando de programar para poder ayudarte. 
  🚀 Pronto tendrás más novedades...`

  await axios.post(`${TELEGRAM_API}/sendMessage`, {
    chat_id: chatId,
    text: message
  })
  return res.send()
})



app.listen(process.env.PORT || 5000, async () => {
  console.log('🚀 app running on port', process.env.PORT || 5000)
  await init()
})