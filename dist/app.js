"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
const bolt_1 = require("@slack/bolt");
const interpret_1 = require("./lib/interpret");
const pull_1 = require("./lib/pull");
const app = new bolt_1.App({
    token: process.env.SLACK_BOT_TOKEN,
    signingSecret: process.env.SLACK_SIGNING_SECRET,
    socketMode: true,
    appToken: process.env.SLACK_APP_TOKEN,
    logLevel: bolt_1.LogLevel.DEBUG,
});
app.use(async ({ next }) => {
    await next();
});
// Listens to incoming messages that contain "hello"
app.message(/.*/, async ({ message, client, say }) => {
    // Filter out message events with subtypes (see https://api.slack.com/events/message)
    console.log({ message });
    if (!message.subtype && message.channel_type === "im") {
        await say({
            text: "Taking a look...",
        });
        // say() sends a message to the channel where the event was triggered
        const query = await (0, interpret_1.convertPromptToSlackQuery)(message.text);
        console.log({ query });
        // Further processing based on command to fetch and sort messages
        const messages = await (0, pull_1.getMessagesFromWorkspace)({
            client: client,
            query: query,
        });
        const messagesFromPublicChannels = messages.filter((message) => !message.channel?.is_private);
        const contents = (0, pull_1.getMessageContents)(messagesFromPublicChannels);
        const digest = await (0, interpret_1.digestMessages)(contents);
        console.log({
            contents,
            digest
        });
        await say({ text: digest });
    }
});
app.action("button_click", async ({ body, ack, say }) => {
    // Acknowledge the action
    await ack();
    await say(`<@${body.user.id}> clicked the button`);
});
(async () => {
    // Start your app
    await app.start(Number(process.env.PORT) || 3000);
    console.log("⚡️ Bolt app is running!");
})();
//# sourceMappingURL=app.js.map