import { Group as baseGroup } from '@apollosproject/data-connector-rock';
import {
  resolverMerge,
  parseGlobalId,
  createGlobalId,
  withEdgePagination
} from '@apollosproject/server-core';

const defaultResolvers = {
  id: ({ id }, args, context, { parentType }) => createGlobalId(id, parentType.name),
  title: (root, args, { dataSources }) => dataSources.GroupItem.getTitle(root),
  summary: ({ description }, args, { dataSources }) => description,
  groupType: ({ groupTypeId }, args, { dataSources }) =>
    dataSources.GroupItem.getGroupTypeFromId(groupTypeId),
  groupResources: (root, args, { dataSources }) =>
    dataSources.GroupItem.getGroupResources(root),
  resources: ({ id }, args, { dataSources }) => dataSources.GroupItem.getResources(id),
  coverImage: (root, args, { dataSources: { ContentItem } }) =>
    ContentItem.getCoverImage(root),
  avatars: ({ id }, args, { dataSources }) => dataSources.GroupItem.getAvatars(id),
  members: ({ id }, args, { dataSources }) => dataSources.GroupItem.getMembers(id),
  leaders: ({ id }, args, { dataSources }) => dataSources.GroupItem.getLeaders(id),
  people: async ({ id }, args, { dataSources: { GroupItem } }) =>
    GroupItem.paginateMembersById({
      ...args,
      id,
    }),
  chatChannelId: (root, args, { dataSources }) => null, // Deprecated
  streamChatChannel: async (root, args, { dataSources }) =>
    dataSources.GroupItem.getStreamChatChannel(root)
}

const resolver = {
  GroupItem: {
    __resolveType: (root, { dataSources: { Group } }) => Group.resolveType(root),
  },
  Group: {
    ...defaultResolvers,
    schedule: ({ scheduleId }, args, { dataSources }) =>
      dataSources.GroupItem.getScheduleFromId(scheduleId),
    phoneNumbers: ({ id }, args, { dataSources }) => {
      return dataSources.GroupItem.groupPhoneNumbers(id);
    },
    dateTime: ({ scheduleId }, args, { dataSources }) =>
      dataSources.GroupItem.getDateTimeFromId(scheduleId),
    videoCall: (root, args, { dataSources }) =>
      dataSources.GroupItem.getGroupVideoCallParams(root),
    parentVideoCall: (root, args, { dataSources }) =>
      dataSources.GroupItem.getGroupParentVideoCallParams(root),
    allowMessages: (root, args, { dataSources }) =>
      dataSources.GroupItem.allowMessages(root),
    checkin: ({ id }, args, { dataSources: { CheckInable } }) =>
      CheckInable.getFromId(id),
  },
  VolunteerGroup: {
    ...defaultResolvers,
    id: ({ id }, args, context, { parentType }) => createGlobalId(id, parentType.name),
    checkin: ({ id }, args, { dataSources: { CheckInable } }) =>
      CheckInable.getFromId(id),
  },
  Mutation: {
    addMemberAttendance: async (root, { id }, { dataSources }) => {
      const globalId = parseGlobalId(id);
      try {
        return dataSources.Group.addMemberAttendance(globalId.id);
      } catch (e) {
        console.log({ e });
      }

      return null;
    },
    updateGroupCoverImage: async (root, { imageId, groupId }, { dataSources }) => {
      try {
        return dataSources.GroupItem.updateCoverImage({
          groupId,
          imageId,
        });
      } catch (e) {
        console.log({ e });
      }

      return null;
    },
    updateGroupResourceUrl: async (
      root,
      { groupId, relatedNodeId, title, url },
      { dataSources }
    ) => {
      try {
        if (relatedNodeId) {
          return dataSources.GroupItem.updateResource({
            groupId,
            relatedNodeId,
            title,
            url,
          });
        } else {
          return dataSources.GroupItem.addResource({ groupId, title, url });
        }
      } catch (e) {
        console.log({ e });
      }

      return null;
    },
    updateGroupResourceContentItem: async (
      root,
      { groupId, relatedNodeId, contentItemId },
      { dataSources }
    ) => {
      try {
        if (relatedNodeId) {
          return dataSources.GroupItem.updateResource({
            groupId,
            relatedNodeId,
            contentItemId,
          });
        } else {
          return dataSources.GroupItem.addResource({
            groupId,
            contentItemId,
          });
        }
      } catch (e) {
        console.log({ e });
      }

      return null;
    },
    removeGroupResource: async (root, { groupId, relatedNodeId }, { dataSources }) => {
      try {
        return dataSources.GroupItem.removeResource({ groupId, relatedNodeId });
      } catch (e) {
        console.log({ e });
      }
    },
  },
  Query: {
    groupCoverImages: async (root, args, { dataSources }) =>
      dataSources.GroupItem.getCoverImages(),
    // groupResourceOptions: async (
    //   root,
    //   { groupId, input: { first, after } = {} },
    //   { dataSources }
    // ) => dataSources.GroupItem.getResourceOptions({ groupId, first, after }),
    groupResourceOptions: async (root, { groupId, input }, { dataSources }) => {
      const { id } = parseGlobalId(groupId);
      return dataSources.ContentItem.paginate({
        cursor: await dataSources.GroupItem.getResourceOptions(id),
        args: input,
      })
    }
  },
};

export default resolverMerge(resolver, baseGroup);
