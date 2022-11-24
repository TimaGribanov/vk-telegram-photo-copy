import axios from 'axios'

import { readFileSync } from "fs"
const config = JSON.parse(readFileSync("./config.json"))
//Waiting for assert stage 4 so that it would be added to ESlint
//import config from './config.json' assert { type: 'json' }
import logger from './logger.js'

//VK API config
const accessToken = config.vk.token
const ownerId = config.vk.userId
const albumId = config.vk.albumId

const vkApiReq = async (offset) => {
    try {
        logger.info('[vk.js] vkApiReq: Running axios get to fetch data from VK API')
        const res = await axios
            .get('https://api.vk.com/method/photos.get', {
                params: {
                    access_token: accessToken,
                    owner_id: ownerId,
                    album_id: albumId,
                    offset: offset,
                    v: 5.131
                }
            })
            .then(response => {
                logger.info(`[vk.js] vkApiReq_axios: Got results from VK API`)
                return response.data.response
            })
            .catch(error => logger.error(`[vk.js] vkApiReq_axios: ${error}`))
        
        return res
    } catch (error) {
        logger.error(`[vk.js] vkApiReq: ${error}`)
    }
}

export default vkApiReq