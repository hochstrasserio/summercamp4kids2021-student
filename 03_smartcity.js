const numbro = require('numbro')
const { AirQualitySensor } = require('./lib/AirQualitySensor')

async function timeout(ms) {
    // Wartet x Millisekunden lange
    return new Promise((resolve) => setTimeout(resolve, ms))
}

async function main() {
    // AirQualitySensor verwenden um Luftqualität festzustellen
    // - Initialisieren
    // - Kalibrieren
    // - Daten anzeigen
    // - Daten in Datei speichern
}

main().catch((err) => console.error(err))