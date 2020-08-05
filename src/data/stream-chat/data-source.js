import { RESTDataSource } from 'apollo-datasource-rest'
import { createGlobalId } from '@apollosproject/server-core'
import ApollosConfig from '@apollosproject/config';
import { StreamChat as StreamChatClient } from 'stream-chat';

const { STREAM } = ApollosConfig
const { CHAT_SECRET, CHAT_API_KEY, CHAT_APP_ID } = STREAM

export default class StreamChat extends RESTDataSource {

    constructor(...args) {
        super(...args);
        if (CHAT_SECRET && CHAT_API_KEY) {
            this.chatClient = new StreamChatClient(CHAT_API_KEY, CHAT_SECRET);
        } else {
            console.warn(
                'You are using the Stream Chat datasource without Stream credentials. To avoid issues, add Stream Chat credentials to your config.yml or remove the Stream Chat datasource'
            );
        }
    }

    generateUserToken = async () => {
        const { Auth } = this.context.dataSources

        const currentPerson = await Auth.getCurrentPerson()
        const authId = createGlobalId(currentPerson.id, "AuthenticatedUser")
        const { chatClient } = this

        return chatClient.createToken(authId.split(":")[1])
    }
}