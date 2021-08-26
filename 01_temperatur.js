let { Bme680 } = require('bme680-sensor')

// Bme680
// sensor.initialize()
// sensor.getSensorData()

async function main() {
    let sensor = new Bme680(1, 0x76)
    // Temperatur anzeigen
}

main()
