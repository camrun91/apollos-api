import { createGlobalId, resolverMerge } from '@apollosproject/server-core';
import * as coreLiveStream from '@apollosproject/data-connector-church-online';
import { Utils } from '@apollosproject/data-connector-rock';
import { get } from 'lodash';
import moment from 'moment';

const { createImageUrlFromGuid } = Utils;

const resolver = {
  LiveNode: {
    __resolveType: ({ __typename, __type }, args, resolveInfo) =>
      __typename || resolveInfo.schema.getType(__type),
  },
  LiveStream: {
    id: ({ id, eventStartTime, eventEndTime }, args, context, { parentType }) =>
      createGlobalId(
        JSON.stringify({ id, eventStartTime, eventEndTime }),
        parentType.name
      ),
    isLive: ({ id, eventStartTime, eventEndTime }) =>
      moment().isBetween(eventStartTime, eventEndTime),
    media: ({ attributeValues }) => {
      const liveStreamUrl = get(attributeValues, 'liveStreamUrl.value');

      if (liveStreamUrl) {
        return { sources: [{ uri: liveStreamUrl }] };
      }

      return null;
    },
    actions: async ({ id, guid }, args, { dataSources }) => {
      if (!id || id === "") return []

      const unresolvedNode = await dataSources.LiveStream.getRelatedNodeFromId(id);
      // Get Matrix Items
      const liveStreamActionsMatrixGuid = get(
        unresolvedNode,
        'attributeValues.liveStreamActions.value',
        ''
      );
      const liveStreamActionsItems = await dataSources.MatrixItem.getItemsFromId(
        liveStreamActionsMatrixGuid
      );

      const liveStreamDefaultActionItems = await dataSources.DefinedValueList.getByIdentifier(
        367
      );

      const liveStreamDefaultActionItemsMapped = liveStreamDefaultActionItems.definedValues.map(
        ({ attributeValues: defaultLiveStreamActionsItemsAttributeValues }) => ({
          action: 'OPEN_URL',
          image: get(defaultLiveStreamActionsItemsAttributeValues, 'image.value', null)
            ? createImageUrlFromGuid(
                defaultLiveStreamActionsItemsAttributeValues.image.value
              )
            : null,
          relatedNode: {
            __typename: 'Url',
            url: get(defaultLiveStreamActionsItemsAttributeValues, 'url.value', null),
          },
          title: get(defaultLiveStreamActionsItemsAttributeValues, 'title.value', null),
        })
      );

      const liveStreamActionsItemsMapped = liveStreamActionsItems.map(
        ({ attributeValues: liveStreamActionsItemsAttributeValues }) => ({
          action: 'OPEN_URL',
          duration: get(liveStreamActionsItemsAttributeValues, 'duration.value', null),
          image: get(liveStreamActionsItemsAttributeValues, 'image.value', null)
            ? createImageUrlFromGuid(liveStreamActionsItemsAttributeValues.image.value)
            : null,
          relatedNode: {
            __typename: 'Url',
            url: get(liveStreamActionsItemsAttributeValues, 'url.value', null),
          },
          start: get(liveStreamActionsItemsAttributeValues, 'startTime.value', null),
          title: get(liveStreamActionsItemsAttributeValues, 'title.value', null),
        })
      );

      return liveStreamDefaultActionItemsMapped.concat(liveStreamActionsItemsMapped);
    },
    contentItem: ({ contentChannelItemId }, _, { dataSources }) => {
      if (contentChannelItemId) {
        const { ContentItem } = dataSources;

        return ContentItem.getFromId(contentChannelItemId);
      }

      return null;
    },
    relatedNode: async (
      { id, contentChannelItemId },
      _,
      { models, dataSources },
      resolveInfo
    ) => {
      try {
        let globalId = '';

        // If we know that the related node is a content channel item, let's just query for that
        if (contentChannelItemId) {
          const { ContentItem, Cache } = dataSources;
          const cachedKey = `liveStream-contentItem-${id}`
          const cachedValue = await Cache.get({
            key: cachedKey,
          });
          /**
           * Set up an empty object to be used as our content item
           */
          let contentItem = {}

          /**
           * If Redis has this item stored already, don't make the request to
           * Rock
           */
          if (cachedValue) {
            contentItem = cachedValue
          } else {
            contentItem = await ContentItem.getFromId(contentChannelItemId);

            if (contentItem != null) {
              await Cache.set({
                key: cachedKey,
                data: contentItem,
                expiresIn: 60 * 60 // 1 hour cache
              });
            }
          }

          const resolvedType = ContentItem.resolveType(contentItem);
          globalId = createGlobalId(contentChannelItemId, resolvedType);
        } else if (id) {
          // If we don't know the related node type, we need to manually figure it out
          const { LiveStream } = dataSources;
          const unresolvedNode = await LiveStream.getRelatedNodeFromId(id);

          const { globalId: relatedNodeGlobalId } = unresolvedNode;
          globalId = relatedNodeGlobalId;
        }

        return await models.Node.get(globalId, dataSources, resolveInfo);
      } catch (e) {
        console.log(`Error fetching live stream related node ${id}`, e);
        return null;
      }
    },
    streamChatChannel: async (root, _, { dataSources }) =>
      dataSources.LiveStream.getStreamChatChannel(root),
    checkin: ({ attributeValues }, args, { dataSources: { CheckInable } }) => {
      const groupId = get(attributeValues, 'checkInGroup.value', '');

      return CheckInable.getById(groupId);
    },
  },
  Query: {
    floatLeftLiveStream: async (root, args, { dataSources }) => {
      /**
       * Beacuse the TV apps are a bit more sensative to errors, we
       * want to capture all data fetching in a try catch with very,
       * very explicit error handling and defaulting all return values
       * to `null`
       */
      const { LiveStream } = dataSources
      try {
        /**
         * getLiveStreams returns an array of Live Stream objects, but this
         * specific endpoint only returns a single Live Stream.
         */
        const allActiveLiveStreams = await LiveStream.getLiveStreams({ anonymously: true })

        if (allActiveLiveStreams && allActiveLiveStreams.length > 0) {
          return allActiveLiveStreams[0]
        }
      } catch (e) {
        console.log("Error when fetching live streams for TV Apps")
        console.log({ e })
      }

      return null
    },
    floatLeftEmptyLiveStream: (root, args, { dataSources }) => null,
  },
};

export default resolverMerge(resolver, coreLiveStream);
