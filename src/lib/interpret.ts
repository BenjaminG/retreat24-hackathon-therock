import OpenAI from "openai";
import { SimpleMessage } from "./pull";

const openai = new OpenAI({
  apiKey: process.env["OPENAI_API_KEY"], // This is the default and can be omitted
});

export async function convertPromptToSlackQuery(userText: string) {
  try {
    const today = new Date().toDateString();
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
          Transform the user's request into a query string for Slack's search API, maintaining exact formatting for channel and user identifiers. Follow these guidelines:
          - "query": Specify the primary search terms.
          - "in:": Include only if specific channels are mentioned, preserving the exact format, e.g., 'in:<#CDY78CYS0|onboarding-360>'.
          - "from:": Include only if specific users are mentioned, preserving the exact format, e.g., 'from:<@U036YTWQFJ7>'.
          - "after:", "before:": Use if specific dates are mentioned. Dates must be inferred from the current date and returned in YYYY-MM-DD format.
          All other modifiers are ignored.
          Ignore the user role or position to create the query. Today's date is ${today}.
          
          Examples:
          Request: "Find posts about Gong since yesterday."
          Response: "Gong after:YYYY-MM-DD"
          Request: "I want to see all the messages from the last week that mention 'sales' from <@U036YTWQFJ7> in the <#CDY78CYS0|onboarding-360> channel."
          Response: "sales in:<#CDY78CYS0|onboarding-360> from:<@U036YTWQFJ7> after:YYYY-MM-DD before:YYYY-MM-DD"
          Request: "Show me all the messages from the last month that mention 'sales' in the <#CDY78CYS0|onboarding-360> channel."
          Response: "sales in:<#CDY78CYS0|onboarding-360> after:YYYY-MM-DD before:YYYY-MM-DD"
          `,
        },
        { role: "user", content: userText },
      ],
      model: "gpt-3.5-turbo",
    });

    return chatCompletion.choices[0]?.message.content;
  } catch (error) {
    console.error("Error calling GPT-3:", error);
    return null;
  }
}

function formatMessageAndMetadataForOpenAI(message: SimpleMessage): string {
  return `---
  From: ${message.from}
  Channel: ${message.channel}
  Permalink: ${message.permalink}
  Date: ${message.date}
  ${message.text}
---`;
}

export async function digestMessages(messages: SimpleMessage[]) {
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        {
          role: "system",
          content: `
          Given the following messages from Slack, summarize the information and callout actions items assigned to each person as a Slack post.
          Sort the output of by order of relevance to what I care about as a {PROVIDED JOB TITLE}. Share post permalinks for reference. Transform any channel id to <#channel_id|channel_name> format, and user id to <@user_id> format.
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
  } catch (error) {
    console.error("Error calling GPT-3:", error);
    return null;
  }
}
