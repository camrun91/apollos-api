const resolver = {
    Query: {
        streamChatToken: (root, args, { dataSources }) => {
            console.log("CHAT")

            return dataSources.StreamChat.generateUserToken()
        }
    },
};

export default resolver