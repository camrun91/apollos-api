import {
    Auth as coreAuth,
} from '@apollosproject/data-connector-rock'
import ApollosConfig from '@apollosproject/config'
import { resolverMerge } from '@apollosproject/server-core'

const resolver = {
    Mutation: {
        requestEmailLoginPin: (root, args, { dataSources }) =>
            dataSources.Auth.requestEmailPin(args),
        changePasswordWithPin: (root, { email, pin, newPassword }, { dataSources }) =>
            dataSources.Auth.changePasswordWithPin({ email, pin, newPassword }),
    },
    Query: {
        canAccessExperimentalFeatures: async (root, args, { dataSources }) =>
            dataSources.Auth.isInSecurityGroup(ApollosConfig.ROCK_MAPPINGS.SECURITY_GROUPS.EXPERIMENTAL_FEATURES),
    }
}

export default resolverMerge(resolver, coreAuth)