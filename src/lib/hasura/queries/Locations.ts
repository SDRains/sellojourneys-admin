import { gql } from '@apollo/client'

export const GetAllActiveLocations = gql`
    query MyQuery {
      locations(where: {is_active: {_eq: true}}, order_by: {name: asc}) {
        id
        name
        hero_image
        city
        state
        stamp {
          stamp_image
        }
      }
    }
`