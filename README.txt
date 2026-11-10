JARVIS AI – Android phone prototype

WHAT WORKS
- Futuristic JARVIS interface
- Tap-to-speak voice input where the browser supports Web Speech API
- Spoken responses using device text-to-speech
- Basic commands: open YouTube, WhatsApp, Google; tell time/date; study tip; identity
- Text command input

IMPORTANT LIMITATIONS
- This is a web prototype, not a full native Android app.
- It does not continuously listen for “Hey Jarvis” in the background.
- It cannot control every installed app, read notifications, or change protected Android settings.
- Speech recognition support varies by browser/device and requires microphone permission.
- AI model connection is not included; do not put a private API key in a public HTML file.
- For full Android control, a later native Android app and explicit Android permissions are needed.

HOW TO USE ON YOUR PHONE
1. Extract the ZIP.
2. Open index.html in Chrome.
3. Allow microphone access when asked.
4. Tap Start listening and try “Open YouTube”.
5. You can also type commands.

For installable/offline PWA behavior, the files need to be hosted on HTTPS. Opening index.html directly still lets you test the basic interface, but service-worker installation may not work.
