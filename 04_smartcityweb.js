const numbro = require('numbro')
const { AirQualitySensor } = require('./lib/AirQualitySensor')
const fs = require('fs/promises')
const { createServer } = require('http')
const ejs = require('ejs')
const path = require('path')

const PORT = process.env.PORT ?? 8080

async function timeout(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function readStoredData() {
    try {
        let log = (await fs.readFile(path.resolve(__dirname, './data/data.txt'))).toString()

        return log
            .split('\n') // Jede Zeile wird zu einem einzelnen Element
            .reverse()  // Die Liste umkehren, damit die neuesten Einträge oben sind
            .slice(1, 50) // Nur die ersten 50 Einträge anzeigen und den ersten Eintrag ignorieren
            .map((line) => JSON.parse(line)) // Jede Zeile in ein Objekt umwandeln
    } catch (err) {
        console.error(err)
        return
    }
}

async function startWebserver() {
    createServer(async (req, res) => {
        let data = await readStoredData()

        try {
            res.end(await ejs.renderFile(path.resolve(__dirname, './templates/index.ejs.html'), {
                data
            }))
        } catch (err) {
            console.error(err)
        }
    }).listen(PORT)
}

async function startCollectingSensorData() {
    let sensor = new AirQualitySensor()

    console.log(new Date().toISOString(), 'starting burn in for 5 minutes')

    await sensor.init()

    sensor.sensor.setTempOffset(-8)

    await sensor.calibrate({
        time: 5 * 60 * 1000
    })

    console.log(new Date().toISOString(), 'burn in complete')

    let log = await fs.open(path.resolve(__dirname, './data/data.txt'), 'a+')

    let lastWrite = null

    while (true) {
        let data = await sensor.read()

        if (!data) {
            await timeout(1000)
            continue
        }

        console.clear()
        console.log(new Date().toISOString(), 'current data:')
        console.table([{
            airQualityIndex: `${numbro(data.airQualityIndex).format({ mantissa: 2 })}`,
            humidity: `${numbro(data.humidity).format({ mantissa: 3 })} %RH`,
            gas: `${numbro(data.gasResistance).format({ mantissa: 2 })} Ohm`,
            temperature: `${numbro(data.temperature).format({ mantissa: 2 })} ºC`,
            pressure: `${numbro(data.pressure).format({ mantissa: 2 })} hPa`,
        }])

        if (lastWrite === null || (new Date().getTime() - lastWrite) > 60 * 1000) {
            console.log('writing data to log')
            await log.write(JSON.stringify({
                ...data,
                timestamp: new Date().getTime(),
            }) + '\n')
            lastWrite = new Date().getTime()
        }

        await timeout(1000)
    }
}

async function main() {
    await startWebserver()
    await startCollectingSensorData()
}

main().catch((err) => console.error(err))