import tgSender from './telegram.js'
import vkApiReq from './vk.js'
import { dbReq, dbInsert, dbGetNotSynced } from './db.js'
import logger from './logger.js'

//Get the size of the album
async function getAlbumSize() {
    logger.info('getalbumSize: Trying to get the current size of VK album')
    try {
        const res = await vkApiReq(1)

        logger.info(`getAlbumSize: The current size is ${res.count}`)
        return res.count
    }
    catch (err) {
        logger.error(`getAlbumSize: ${err}`)
    }
}

//Get URL values
const goThruArray = async (obj) => {
    let resultArr = []

    obj.forEach(e => {
        const sizes = e.sizes
        let finalUrl

        //Get the URL based on the biggest format type
        for (let i = sizes.length - 1; i > 0; i--) {
            if (!finalUrl) {
                if (sizes[i].type === 'w') {
                    finalUrl = [e.date, sizes[i].url]
                    break
                }

                if (sizes[i].type === 'z') {
                    finalUrl = [e.date, sizes[i].url]
                    break
                }

                if (sizes[i].type === 'y') {
                    finalUrl = [e.date, sizes[i].url]
                    break
                }

                if (sizes[i].type === 'x') {
                    finalUrl = [e.date, sizes[i].url]
                    break
                }

                if (sizes[i].type === 'm') {
                    finalUrl = [e.date, sizes[i].url]
                    break
                }

                if (sizes[i].type === 's') {
                    finalUrl = [e.date, sizes[i].url]
                    break
                }
            } else {
                break
            }
        }

        //If any of the types not present check by size comparison
        if (!finalUrl) {
        for (let i = sizes.length - 1; i = 0; i--) {
            if (sizes[i].height > sizes[i - 1].height) {
                finalUrl = [e.date, sizes[i].url]
            } else {
                if (sizes[i].width > sizes[i - 1].width) {
                    finalUrl = [e.date, sizes[i].url]
                } else {
                    finalUrl = finalUrl
                }
            }
        }
    }

    resultArr.push(finalUrl)
})

return Object.values(resultArr)
}

//Sync based on DB
const sync = async () => {
    //Function for promise delay
    function delay(milliseconds) {
        return new Promise(resolve => {
            setTimeout(resolve, milliseconds)
        })
    }

    logger.info(`sync: Get an array for syncing from DB`)
    const syncArr = await dbGetNotSynced() //Get an array of not synced URLs from DB
    logger.info(`sync: ${syncArr.length} images to be synced`)

    for (let i = 0; i < syncArr.length; i++) {
        const url = syncArr[i]

        let status

        do {
            logger.info(`sync: Trying to upload ${url} to Telegram`)
            status = await tgSender(url)
            if (status != 200) {
                if (status == 400) {
                    logger.info(`sync: Telegram status is ${status}, hence skipped ${url}`)
                    const query = `UPDATE Images SET Status = 1 WHERE URL = "${url}"`
                    logger.info(`sync: Marking this entry with 1 in DB`)
                    logger.info(`sync: ${query}`)
                    dbReq(query)
                    break
                } else {
                    logger.info(`sync: Telegram status is ${status}, hence waiting 10 seconds`)
                    await delay(10000)
                }
            }
            else
                logger.info(`sync: Status is ${status} – SUCCESS.`)
            const query = `UPDATE Images SET Status = 1 WHERE URL = "${url}"`
            logger.info(`sync: Marking this entry with 1 in DB`)
            logger.info(`sync: ${query}`)
            dbReq(query)
        } while (status != 200)
    }
}

//Function to sync for the fisrt time
const firstTime = async (size) => {
    let photosArray = [] //Final array of URLs
    let photosArrayObj = [] //Pre-final object of arrays of URLs (fro each offset bunch)
    let objArray = [] //Object for one offset bunch
    const step = 50
    const numberOfSteps = Math.ceil(size / step)

    logger.info(`firstTime: The step is ${step}, number of steps to make is ${numberOfSteps}`)
    for (let i = 0; i < numberOfSteps; i++) {
        const offset = step * i

        logger.info(`firstTime: Getting objArray with offset ${offset}`)
        objArray = await vkApiReq(offset)

        logger.info('firstTime: Pushing current objArray to photosArrayObj')
        photosArrayObj.push(await goThruArray(objArray.items))
    }

    logger.info('firstTime: Go through photosArrayObj and get photosArray')
    photosArrayObj.forEach(val => {
        val.forEach(e => {
            photosArray.push(e)
        })
    })

    logger.info('firstTime: Insert photosArray into DB with dbInsert()')
    await dbInsert(photosArray)

    logger.info('firstTime: Start syncing with sync()')
    await sync()
}

//Function to sync the images array
const syncAgain = async (currSize) => {
    let photosArrayObj = []
    let photosArray = []
    let objArray = []

    logger.info('syncAgain: Get an array of objects of images from VK')
    objArray = await vkApiReq(currSize)

    logger.info('syncAgain: Variable objArray is set. Creating the array of photos')

    if (objArray.items.length) {
        logger.info('syncAgain: Go through objArray and get photosArrayObj')
        photosArrayObj.push(await goThruArray(objArray.items))

        logger.info('syncAgain: Go through photosArrayObj and get photosArray')
        photosArrayObj.forEach(val => {
            val.forEach(e => {
                photosArray.push(e)
            })
        })

        logger.info('syncAgain: Insert photosArray into DB with dbInsert()')
        await dbInsert(photosArray)
    }

    logger.info('syncAgain: Start syncing with sync()')
    await sync()
}

const main = async () => {
    logger.info('STARTUP')
    logger.info('Calculating size of VK album...')
    const VKSize = await getAlbumSize()
    logger.info(`VKSize: ${VKSize}`)
    logger.info('Calculating size of DB...')
    const dbSize = await dbReq('SELECT COUNT(*) AS `count` FROM Images;')
    logger.info(`VKSize: ${dbSize}`)

    if (dbSize[0].count == 0) {
        logger.info(`DB is empty – syncing for the first time (firstTime)`)
        await firstTime(VKSize)
    }
    else {
        logger.info('DB is not empty – syncing again (syncAgain')
        await syncAgain(dbSize[0].count)
    }

    logger.info('STOPPED')
    logger.info('')
}

main()