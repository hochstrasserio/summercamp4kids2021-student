let { Bme680 } = require('bme680-sensor')

async function main() {
    let sensor = new Bme680(1, 0x76)
    // Initialisieren
    // Burn in
    // Gas-Messwert anzeigen
}

main()
