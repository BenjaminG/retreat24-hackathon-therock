"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getMessageContents = exports.getMessagesFromWorkspace = exports.getChannels = void 0;
async function getChannels({ client, }) {
    const channelsListResponse = await client.conversations.list({});
    const channels = channelsListResponse.channels || [];
    return (channels.map(({ name, id, purpose }) => ({
        name: name,
        id: id,
        purpose: purpose?.value,
    })) || []);
}
exports.getChannels = getChannels;
async function getMessagesFromWorkspace({ client, query, sort, sort_dir, count, }) {
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
exports.getMessagesFromWorkspace = getMessagesFromWorkspace;
function getMessageContents(messages) {
    return messages.map((message) => {
        const timestamp = message.ts.split(".")[0];
        return {
            text: message.text,
            from: message.user,
            channel: message.channel.id,
            permalink: message.permalink,
            date: new Date(parseInt(timestamp) * 1000).toDateString(),
        };
    });
}
exports.getMessageContents = getMessageContents;
//# sourceMappingURL=pull.js.map