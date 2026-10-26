require("dotenv").config();
const {
  Client,
  GatewayIntentBits,
  SlashCommandBuilder,
  REST,
  Routes,
  EmbedBuilder,
  AttachmentBuilder,
  PermissionFlagsBits,
} = require("discord.js");
const path = require("path");

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
const allowedRoleIds = (process.env.ALLOWED_ROLE_IDS || "")
  .split(",").map(id => id.trim()).filter(Boolean);

if (!token || !clientId || !guildId) {
  console.error("Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID in your .env file.");
  process.exit(1);
}

const patrolCommand = new SlashCommandBuilder()
  .setName("patrol")
  .setDescription("Announce an upcoming hosted patrol.")
  .addStringOption(option =>
    option.setName("date")
      .setDescription("Patrol date, e.g. 31/10/2026")
      .setRequired(true))
  .addStringOption(option =>
    option.setName("time")
      .setDescription("Patrol start time in UK time, e.g. 19:00")
      .setRequired(true))
  .addStringOption(option =>
    option.setName("services")
      .setDescription("Services attending (optional)")
      .setRequired(false)
      .addChoices(
        { name: "LSPD, BCSO and Traffic", value: "all" },
        { name: "LSPD only", value: "lspd" },
        { name: "BCSO only", value: "bcso" },
        { name: "Traffic only", value: "traffic" },
        { name: "LSPD and BCSO", value: "lspd_bcso" },
        { name: "LSPD and Traffic", value: "lspd_traffic" },
        { name: "BCSO and Traffic", value: "bcso_traffic" }
      ));

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.GuildMessageReactions] });

async function registerCommand() {
  const rest = new REST({ version: "10" }).setToken(token);
  await rest.put(Routes.applicationGuildCommands(clientId, guildId), {
    body: [patrolCommand.toJSON()],
  });
  console.log("Registered /patrol for the configured server.");
}

function isValidDate(date) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(date)) return false;
  const [day, month, year] = date.split("/").map(Number);
  const parsed = new Date(year, month - 1, day);
  return parsed.getFullYear() === year && parsed.getMonth() === month - 1 && parsed.getDate() === day;
}
function isValidTime(time) {
  if (!/^(?:[01]\d|2[0-3]):[0-5]\d$/.test(time)) return false;
  return true;
}

client.once("ready", () => {
  console.log(`Logged in as ${client.user.tag}`);
});

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand() || interaction.commandName !== "patrol") return;

  if (allowedRoleIds.length) {
    const memberRoles = interaction.member?.roles?.cache;
    const authorised = memberRoles && allowedRoleIds.some(id => memberRoles.has(id));
    if (!authorised) {
      return interaction.reply({ content: "You do not have permission to use this command.", ephemeral: true });
    }
  } else if (!interaction.memberPermissions?.has(PermissionFlagsBits.ManageGuild)) {
    return interaction.reply({ content: "You need the Manage Server permission to use this command. To use role-based access, add role IDs to ALLOWED_ROLE_IDS in your .env file.", ephemeral: true });
  }

  const date = interaction.options.getString("date", true).trim();
  const time = interaction.options.getString("time", true).trim();
  const serviceChoice = interaction.options.getString("services") || "all";

  if (!isValidDate(date)) {
    return interaction.reply({ content: "Please enter a valid date in DD/MM/YYYY format, for example `31/10/2026`.", ephemeral: true });
  }
  if (!isValidTime(time)) {
    return interaction.reply({ content: "Please enter the time in 24-hour HH:MM format, for example `19:00`.", ephemeral: true });
  }

  const services = {
    all: "• LSPD\n• BCSO\n• Traffic",
    lspd: "• LSPD",
    bcso: "• BCSO",
    traffic: "• Traffic",
    lspd_bcso: "• LSPD\n• BCSO",
    lspd_traffic: "• LSPD\n• Traffic",
    bcso_traffic: "• BCSO\n• Traffic",
  }[serviceChoice];

  const banner = new AttachmentBuilder(path.join(__dirname, "patrol.png"), { name: "patrol.png" });
  const embed = new EmbedBuilder()
    .setColor(0xD97736)
    .setTitle("🚔 Upcoming Hosted Patrol")
    .setDescription(
      "A hosted patrol has been scheduled. Please react below to indicate whether you will be attending.\n\n" +
      "**Patrol Details**\n" +
      `📅 **Date:** ${date}\n` +
      `🕒 **Start Time:** ${time} UK time\n\n` +
      "**Services Available for Patrol**\n" + services + "\n\n" +
      "**Attendance**\n" +
      "✅ — Attending\n" +
      "❌ — Unable to attend"
    )
    .setImage("attachment://patrol.png")
    .setFooter({ text: `Hosted by ${interaction.user.username} • Westshore Roleplay` })
    .setTimestamp();

  await interaction.reply({ content: "Your patrol announcement has been posted.", ephemeral: true });
  const message = await interaction.channel.send({ embeds: [embed], files: [banner] });
  await message.react("✅");
  await message.react("❌");
});

registerCommand().catch(error => {
  console.error("Failed to register /patrol:", error);
  process.exit(1);
});
client.login(token);
