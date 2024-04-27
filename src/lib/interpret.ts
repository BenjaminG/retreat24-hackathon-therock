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
          Translate the following user request into a Slack search API query string
          You should extract the following search modifiers and respect the expected format from Slack:
          - "query": the query string to search for.
          - "from:": if one or more users are specified, only messages from those users will be returned.
          - "after:": if a date or timeframe is specified, only messages sent after that date will be returned. Must be a date in the format YYYY-MM-DD.
          - "before:": if a date or timeframe is specified, only messages sent before that date will be returned. Must be a date in the format YYYY-MM-DD.
          Don't pay attention to the user role or position to create the query. Today's date is ${today}.

          Example 1: "I would like you to get all the posts since yesterday that are talking about Gong. Sort the output of by order of relevance to what I care about as an Account Executive"
          Output: Gong after:yesterday
          Example 2: "I want to see all the messages from the last week that mention the word 'sales' from <@U036YTWQFJ7> in the <#CDY78CYS0|onboarding-360> channel"
          Output: sales in:<#CDY78CYS0> from:<@U036YTWQFJ7> before:2024-04-27 after:2024-04-19
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
