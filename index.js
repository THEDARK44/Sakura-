const { default: makeWASocket, useMultiFileAuthState, jidDecode } = require("@whiskeysockets/baileys");
const pino = require("pino");
const fs = require("fs");
require("./config");

async function start() {
    const { state, saveCreds } = await useMultiFileAuthState('session_sakura');
    const sock = makeWASocket({
        auth: state,
        logger: pino({ level: "silent" }),
        browser: ["Sakura-Bot", "Chrome", "1.0.0"],
        syncFullHistory: false
    });

    sock.ev.on('messages.upsert', async (chatUpdate) => {
        const mek = chatUpdate.messages[0];
        if (!mek.message || mek.key.fromMe) return;
        const from = mek.key.remoteJid;
        const body = mek.message.conversation || mek.message.extendedTextMessage?.text || "";
        const isCmd = body.startsWith(".");
        const command = isCmd ? body.slice(1).trim().split(' ')[0].toLowerCase() : "";
        const args = body.trim().split(/ +/).slice(1);

        // Lecture automatique des fichiers dans le dossier plugins
        const pluginFiles = fs.readdirSync("./plugins").filter(file => file.endsWith(".js"));
        for (const file of pluginFiles) {
            const plugin = require(`./plugins/${file}`);
            if (plugin.command && plugin.command.includes(command)) {
                await plugin.exec(sock, from, mek, args);
            }
        }
    });

    sock.ev.on('creds.update', saveCreds);
    sock.ev.on('connection.update', (up) => {
        if (up.connection === 'open') console.log("🌸 EMPIRE SAKURA PRÊT : " + sock.user.id);
        if (up.connection === 'close') start();
    });
}
start();


