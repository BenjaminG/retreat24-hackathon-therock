import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env['OPENAI_API_KEY'], // This is the default and can be omitted
});

export async function convertPromptToSlackQuery(userText: string) {
  console.log({ OPENAI_API_KEY: process.env.OPENAI_API_KEY });
  
  try {
    const chatCompletion = await openai.chat.completions.create({
      messages: [
        { role: 'system', content: `
          Translate the following user request into a Slack search API query string
          You should extract the following search modifiers and respect the expected format from Slack:
          - "query": the query string to search for.
          - "in:": if one or more channels are specified, only messages from those channels will be returned. If not channels are specified, do not add this modifier.
          - "from:": if one or more users are specified, only messages from those users will be returned.
          - "after:": if a date or timeframe is specified, only messages sent after that date will be returned. Must be a date in the format YYYY-MM-DD.
          - "before:": if a date or timeframe is specified, only messages sent before that date will be returned. Must be a date in the format YYYY-MM-DD.
          Don't pay attention to the user role or position to create the query.

          Example 1: "I would like you to get all the posts since yesterday that are talking about Gong. Sort the output of by order of relevance to what I care about as an Account Executive"
          Output: "Gong after:yesterday"
          Example 2: "I want to see all the messages from the last week that mention the word 'sales' from <@U036YTWQFJ7> in the <#CDY78CYS0|onboarding-360> channel"
          Output: "sales in:<#CDY78CYS0> from:<@U036YTWQFJ7> before:2024-04-27 after:2024-04-19"
        ` },
        { role: 'user', content: userText }
      ],
      model: 'gpt-3.5-turbo',
    });
    
    return chatCompletion.choices[0]?.message.content;
  } catch (error) {
    console.error('Error calling GPT-3:', error);
    return null;
  }
}
