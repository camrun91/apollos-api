import gql from 'graphql-tag';

/**
 * Copies the LiveStream schema from @apollos/data-schema-1.5.0
 */
export default gql`
  interface LiveNode {
    liveStream: LiveStream
  }

  extend type EventContentItem implements LiveNode {
    liveStream: LiveStream
  }

  type LiveStream implements Node {
    id: ID!
    isLive: Boolean @cacheControl(maxAge: 10)
    eventStartTime: String
    eventEndTime: String
    media: VideoMedia
    webViewUrl: String
    contentItem: ContentItem
    @cacheControl(maxAge: 10)
    @deprecated(
      reason: "LiveStreams are not limited to ContentItems. Please use 'relatedNode' instead."
    )

    relatedNode: Node

    chatChannelId: String @deprecated(reason: "Use 'streamChatChannel' instead")
    actions: [LiveStreamAction]
  }

  extend type WeekendContentItem {
    liveStream: LiveStream
  }

  type FloatLeftLiveStream {
    start: String
    isLive: Boolean
    coverImage: ImageMedia
    media: VideoMedia
    title: String
  }

  extend type Query {
    liveStream: LiveStream @deprecated(reason: "Use liveStreams, there may be multiple.")
    liveStreams: [LiveStream] @cacheControl(maxAge: 0)

    floatLeftLiveStream: LiveStream
    floatLeftEmptyLiveStream: LiveStream
  }

  extend enum InteractionAction {
    LIVESTREAM_JOINED
    LIVESTREAM_CLOSED
    VIEWED_ACTION
  }
`;
