import { withEdgePagination } from '@apollosproject/server-core';

const resolver = {
  SearchResult: {
    __resolveType: ({ __typename, __type }, args, resolveInfo) => {
      return __typename || resolveInfo.schema.getType(__type);
    },
  },
  SearchResultsConnection: {
    edges: (edges) => edges,
    pageInfo: (edges) => withEdgePagination({ edges }),
  }
}

// Generic resolvers that should be used universally across SearchResult implementations
export const searchResultResolvers = {
  node: async ({ id }, _, { models, dataSources }, resolveInfo) => {
    try {
      return await models.Node.get(id, dataSources, resolveInfo);
    } catch (e) {
      // Right now we don't have a good mechanism to flush deleted items from the search index.
      // This helps make sure we don't return something unresolvable.
      console.log(`Error fetching search result ${id}`, e);
      return null;
    }
  },
};

export default resolver;