"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.digestMessages = exports.convertPromptToSlackQuery = void 0;
const openai_1 = __importDefault(require("openai"));
const openai = new openai_1.default({
    apiKey: process.env.OPENAI_API_KEY, // This is the default and can be omitted
});
async function convertPromptToSlackQuery(userText) {
    try {
        const today = new Date().toDateString();
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `
          Transform the user's request into a query string for Slack's search API, maintaining exact formatting for channel and user identifiers. Follow these guidelines:

          query: Specify the primary search terms.
          in:: Include only if specific channels are mentioned. If multiple channels are mentioned, list them consecutively without using the "OR" operator, preserving the exact format, e.g., in:<#CDY78CYS0|onboarding-360> in:<#C04B9J6F0|random>.
          from:: Include only if specific users are mentioned, preserving the exact format. If multiple users are mentioned, list them consecutively without using the "OR" operator, e.g., from:<@U036YTWQFJ7> from:<@U036YTWQFJ8>.
          after:, before:: Use if specific dates are mentioned. Dates must be inferred from the current date and returned in YYYY-MM-DD format.
          Ignore any user roles, positions, and sorting or filtering options. These should not influence the query construction.
          Today's date is 2024-04-27.
          Examples:
          
          Request: "Find posts about Gong since yesterday."
          Response: Gong after:YYYY-MM-DD
          Request: "I want to see all the messages from the last week that mention 'sales' from <@U036YTWQFJ7> in the <#CDY78CYS0|onboarding-360> channel."
          Response: sales in:<#CDY78CYS0|onboarding-360> from:<@U036YTWQFJ7> after:YYYY-MM-DD before:YYYY-MM-DD
          Request: "Show me all the messages from the last month that mention 'sales' in the <#CDY78CYS0|onboarding-360> channel."
          Response: sales in:<#CDY78CYS0|onboarding-360> after:YYYY-MM-DD before:YYYY-MM-DD
          Request: "I want to see all the messages from the last week in multiple channels."
          Response: in:<#C02FS2924|general> in:<#C03EDFKR6|random> after:YYYY-MM-DD before:YYYY-MM-DD          
          `,
                },
                { role: "user", content: userText },
            ],
            model: "gpt-3.5-turbo",
        });
        return chatCompletion.choices[0]?.message.content;
    }
    catch (error) {
        console.error("Error calling GPT-3:", error);
        return null;
    }
}
exports.convertPromptToSlackQuery = convertPromptToSlackQuery;
function formatMessageAndMetadataForOpenAI(message) {
    return `---
  From: ${message.from}
  Channel: ${message.channel}
  Permalink: ${message.permalink}
  Date: ${message.date}
  ${message.text}
---`;
}
async function digestMessages(messages) {
    try {
        const chatCompletion = await openai.chat.completions.create({
            messages: [
                {
                    role: "system",
                    content: `
          Summarize the following messages from Slack to create a digest formatted as a Slack post. 
          Highlight action items and responsibilities for each individual mentioned. 
          Order the summary by relevance based on the concerns of job title, position or interests when provided. 
          Convert channel IDs to <#channel_id|channel_name> format and user IDs to <@user_id> format.
          Include links to message permalinks for reference. Use plain language and be concise.          
        `,
                },
                {
                    role: "user",
                    content: `Message count: ${messages.length}
          ---
          ${JSON.stringify(messages.map(formatMessageAndMetadataForOpenAI))}`,
                },
            ],
            model: "gpt-3.5-turbo",
        });
        console.log({ messagesCount: messages.length, chatCompletion });
        return chatCompletion.choices[0]?.message.content;
    }
    catch (error) {
        console.error("Error calling GPT-3:", error);
        return null;
    }
}
exports.digestMessages = digestMessages;
//# sourceMappingURL=interpret.js.map