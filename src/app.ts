/* eslint-disable no-console */
/* eslint-disable import/no-internal-modules */
import { App, LogLevel } from "@slack/bolt";
import { convertPromptToSlackQuery, digestMessages } from "./lib/interpret";
import { getMessageContents, getMessagesFromWorkspace } from "./lib/pull";
import { WebClient } from "@slack/web-api";

const app = new App({
  token: process.env.SLACK_BOT_TOKEN,
  signingSecret: process.env.SLACK_SIGNING_SECRET,
  socketMode: true,
  appToken: process.env.SLACK_APP_TOKEN,
  logLevel: LogLevel.DEBUG,
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
    const query = await convertPromptToSlackQuery(message.text as string);
    console.log('query:', query)
    // Further processing based on command to fetch and sort messages
    const messages = await getMessagesFromWorkspace({
      client: client as unknown as WebClient,
      query: query as string,
    });

    const messagesFromPublicChannels = messages.filter(
      (message) => !message.channel?.is_private
    );

    const contents = getMessageContents(messagesFromPublicChannels);
    const digest = await digestMessages(contents);

    await say({ text: digest! });
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
