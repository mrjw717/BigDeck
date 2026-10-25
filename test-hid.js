const { listStreamDecks, openStreamDeck } = require('@elgato-stream-deck/node');

async function test() {
    console.log('Searching for Stream Decks...');
    const devices = await listStreamDecks();
    console.log('Found devices:', devices);

    if (devices.length === 0) {
        console.log('No devices found.');
        return;
    }

    const device = devices[0];
    console.log(`Opening device: ${device.model} at ${device.path}`);

    try {
        const deck = await openStreamDeck(device.path);
        console.log('Successfully opened Stream Deck!');
        console.log('Model:', deck.PRODUCT_NAME);
        console.log('Serial:', await deck.getSerialNumber());
        console.log('Firmware:', await deck.getFirmwareVersion());

        deck.on('down', (key) => console.log(`Key DOWN: ${key}`));
        deck.on('up', (key) => console.log(`Key UP: ${key}`));
        deck.on('error', (err) => console.error('Deck Error:', err));

        console.log('Press some keys on your Stream Deck... (waiting 10 seconds)');

        // Set a test color to verify visual updates
        console.log('Setting key 0 to RED...');
        await deck.fillKeyColor(0, 255, 0, 0);

        setTimeout(async () => {
            console.log('Closing deck.');
            await deck.close();
            process.exit(0);
        }, 10000);

    } catch (error) {
        console.error('Failed to open deck:', error);
    }
}

test();
