import {
  ConversationsListResponse,
  SearchMessagesResponse,
  WebClient,
} from "@slack/web-api";

type NotUndefined<T> = T extends undefined ? never : T;
export type Message = NotUndefined<
  NotUndefined<SearchMessagesResponse["messages"]>["matches"]
>[number];
export type Channel = NotUndefined<
  ConversationsListResponse["channels"]
>[number];

export type SimpleChannel = {
  name: string;
  id: string;
  purpose?: string;
};

export async function getChannels({
  client,
}: {
  client: WebClient;
}): Promise<SimpleChannel[]> {
  const channelsListResponse = await client.conversations.list({});
  const channels = channelsListResponse.channels || [];
  return (
    channels.map(({ name, id, purpose }) => ({
      name: name!,
      id: id!,
      purpose: purpose?.value,
    })) || []
  );
}

type WorkspaceMessageQueryParams = {
  client: WebClient;
  query: string;
  count?: number;
  sort?: "timestamp" | "score";
  sort_dir?: "asc" | "desc";
};

export async function getMessagesFromWorkspace({
  client,
  query,
  sort,
  sort_dir,
  count,
}: WorkspaceMessageQueryParams): Promise<Message[]> {
  const payload = {
    query,
    sort: sort || "timestamp",
    sort_dir: sort_dir || "desc",
    count,
    token: process.env.SLACK_APP_USER_TOKEN,
  };
  const messagesResponse = await client.search.messages(payload);
  return messagesResponse.messages?.matches || [];
}

export type SimpleMessage = {
  text: string;
  from: string;
  channel: string;
  permalink: string;
  date: string;
};

export function getMessageContents(messages: Message[]): SimpleMessage[] {
  return messages.map((message) => {
    const timestamp = message.ts!.split(".")[0]!;
    return {
      text: message.text!,
      from: message.user!,
      channel: message.channel!.id!,
      permalink: message.permalink!,
      date: new Date(parseInt(timestamp) * 1000).toDateString(),
    };
  });
}
