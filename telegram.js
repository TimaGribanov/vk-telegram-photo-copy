import axios from 'axios'

import { readFileSync } from "fs"
const config = JSON.parse(readFileSync("./config.json"))
//Waiting for assert stage 4 so that it would be added to ESlint
//import config from './config.json' assert { type: 'json' }
import logger from './logger.js'

const botId = config.telegram.token
const channelId = config.telegram.chatId

//Sync images with a Telegram channel with URLs fetched from DB
const tgSender = async (imgInput) => {
    const img = imgInput
    let resStatus

    const object = {
        "chat_id": channelId,
        "photo": img,
        "caption": ""
    }

    logger.info('[telegram.js] tgSender: Run axios POST to send an image to Telegram')
    await axios
        .post(`https://api.telegram.org/bot${botId}/sendPhoto`, object)
        .then((response) => {
            resStatus = response.status
            logger.info(`[telegram.js] tgSender: Status of POST is ${resStatus}`)
        })
        .catch(error => {
            resStatus = error.response.status
            logger.error(`[telegram.js] tgSender: Status of POST is ${resStatus}`)
            logger.error(`[telegram.js] tgSender: ${error}`)
        })
    
    return resStatus
}

export default tgSender