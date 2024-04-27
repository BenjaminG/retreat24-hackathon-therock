import { App, LogLevel } from '@slack/bolt';
import type { StringIndexed } from '@slack/bolt/dist/types/helpers';
import { WebClient } from '@slack/web-api';

export async function getChannelNames({ client }: { client: WebClient }): Promise<string[]> {
  const channelsListResponse = await client.conversations.list({});
  const channels = channelsListResponse.channels || [];
  const names: string[] = channels.filter(({ name }) => name).map(({ name }) => name!) || []
  return names
}

type WorkspaceMessageQueryParams = {
  client: WebClient;
  query: string;
  count?: number;
  sort?: 'timestamp' | 'score';
  sort_dir?: 'asc' | 'desc';
}

export async function getMessagesFromWorkspace({ client, query, sort, sort_dir, count }: WorkspaceMessageQueryParams): Promise<any[]> {
  const messagesResponse = await client.search.messages({ query, sort: sort || 'timestamp', sort_dir: sort_dir || 'desc', count, token: process.env.SLACK_APP_USER_TOKEN })
  return messagesResponse.messages?.matches || []
}

