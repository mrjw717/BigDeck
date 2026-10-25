const { openStreamDeck, listStreamDecks } = require('@elgato-stream-deck/node');

async function check() {
    try {
        const devices = await listStreamDecks();
        if (devices.length > 0) {
            const deck = await openStreamDeck(devices[0].path);
            console.log('Methods on deck:', Object.getPrototypeOf(deck));
            // Check specific methods
            console.log('fillKeyImage exists:', typeof deck.fillKeyImage);
            console.log('fillKeyBuffer exists:', typeof deck.fillKeyBuffer);
            console.log('fillKeyColor exists:', typeof deck.fillKeyColor);
            await deck.close();
        } else {
            // If no device, we can't open a deck easily to check prototype without mocking, 
            // but we can check the module exports or try to instantiate if possible.
            // However, listStreamDecks returns descriptors.
            console.log('No devices found to check methods directly.');

            // Try to require the class directly if possible?
            // The library exports StreamDeck class usually.
        }
    } catch (e) {
        console.error(e);
    }
}

check();
