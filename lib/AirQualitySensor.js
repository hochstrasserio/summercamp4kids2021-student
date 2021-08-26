const { Bme680 } = require('bme680-sensor');
const sum = require('lodash/sum')
const timeout = require('./timeout')

class AirQualitySensor {
    constructor(addr = 0x76, id = 1) {
        this.sensor = new Bme680(id, addr)

        // This will contain the calculated baseline after burn in
        this.gasBaseline = null

        // Set the humidity baseline to 40%, an optimal indoor humidity.
        this.humidityBaseline = 40

        // This sets the balance between humidity and gas reading in the
        // calculation of air_quality_score (25:75, humidity:gas)
        this.humidityWeighting = 0.25

        this.gasReady = false
    }

    async init() {
        await this.sensor.initialize()
    }

    /**
     * Runs burn in of gas sensor for five minutes
     */
    async calibrate({ time = 1000 * 60 * 5 } = {}) {
        const burnInStart = Date.now()
        const burnInData = []

        while((Date.now() - burnInStart) < time) {
            try {
                const { data } = await this.sensor.getSensorData()
                console.log(new Date().toISOString(), 'fetched data for burn in', { data })
                burnInData.push(data.gas_resistance)
            } catch (err) {
                console.error(new Date().toISOString(), 'error while reading data', { err })
            }

            await timeout(1000)
        }

        this.gasBaseline = sum(burnInData.slice(-50)) / 50
        this.gasReady = true
    }

    async read() {
        const { data } = await this.sensor.getSensorData()

        if (data && data.heat_stable) {
            const gas = data.gas_resistance
            const gasOffset = this.gasBaseline - gas

            const humidity = data.humidity
            const humidityOffset = humidity - this.humidityBaseline

            let humidityScore = 0
            let gasScore = 0

            if (humidityOffset > 0) {
                humidityScore = 100 - this.humidityBaseline - humidityOffset
                humidityScore /= (100 - this.humidityBaseline)
                humidityScore *= (this.humidityWeighting * 100)
            } else {
                humidityScore = this.humidityBaseline + humidityOffset
                humidityScore /= this.humidityBaseline
                humidityScore *= (this.humidityWeighting * 100)
            }

            if (gasOffset > 0) {
                gasScore = gas / this.gasBaseline
                gasScore *= (100 - (this.humidityWeighting * 100))
            } else {
                gasScore = (100 - (this.humidityWeighting * 100))
            }

            const airQualityIndex = humidityScore + gasScore

            return {
                airQualityIndex,
                gasResistance: gas,
                temperature: data.temperature,
                humidity: data.humidity,
                pressure: data.pressure,
            }
        }
    }
}

module.exports = {
    AirQualitySensor
}