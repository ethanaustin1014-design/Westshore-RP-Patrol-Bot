WESTSHORE ROLEPLAY — PATROL BOT

FEATURES
- /patrol date time [services]
- Posts an embed with the supplied patrol banner.
- Shows date and UK start time.
- Lists LSPD, BCSO and Traffic (services can be selected).
- Adds ✅ attending and ❌ unable to attend reactions.
- Restricts use to configured staff roles, or Manage Server if no roles are configured.

SETUP (Windows)
1. Install Node.js LTS from the official Node.js website if it is not already installed.
2. Create a bot/application in the Discord Developer Portal and copy its bot token.
3. Invite the bot to your server with the bot and applications.commands scopes, and permissions to View Channels, Send Messages, Embed Links, Attach Files, and Add Reactions.
4. Extract this ZIP to a folder.
5. Rename .env.example to .env and fill in DISCORD_TOKEN, CLIENT_ID and GUILD_ID.
6. ALLOWED_ROLE_IDS is preconfigured for roles 1563610472329257080 and 1563633264810262741. Only members with at least one of these roles can use /patrol.
7. Open PowerShell in the extracted folder and run:
   npm install
   npm start

USAGE
/patrol date:31/10/2026 time:19:00 services:LSPD, BCSO and Traffic

Date must be DD/MM/YYYY. Time must be 24-hour HH:MM in UK local time.
The bot must remain running for the command to stay registered/usable; use a hosting service if you need it online continuously.

SECURITY
Never share your bot token or upload your real .env file. If the token is exposed, reset it in the Discord Developer Portal.
