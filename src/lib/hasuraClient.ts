// lib/apolloClient.ts
import { ApolloClient, InMemoryCache, HttpLink } from '@apollo/client'

const client = new ApolloClient({
    link: new HttpLink({
        uri: 'https://cute-minnow-12.hasura.app/v1/graphql',
        headers: {
            'x-hasura-admin-secret': 't3sC74d0ghCmSazYst0E9t7zTmufe4rBbR18KMSjXtAYEL66dDi5bpNUIi57eEzW',
        },
    }),
    cache: new InMemoryCache(),
})

export default client
