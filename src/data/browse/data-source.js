import RockApolloDataSource from '@apollosproject/rock-apollo-data-source'
import ApollosConfig from '@apollosproject/config'
import { Utils } from '@apollosproject/data-connector-rock'
import {
  isEmpty,
  camelCase,
  get,
  first,
  filter as lodashFilter,
  split,
  intersection
} from 'lodash'
const { ROCK_MAPPINGS } = ApollosConfig

export default class Browse extends RockApolloDataSource {
  getContentFilters = () => this.context.dataSources.ContentItem.byContentChannelIds(
    ApollosConfig.ROCK_MAPPINGS.DISCOVER_CONTENT_CHANNEL_IDS
  )
    .orderBy("Order")
    .get()
}