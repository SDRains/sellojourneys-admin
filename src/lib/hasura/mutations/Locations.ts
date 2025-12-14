import { gql } from '@apollo/client'

export const SetLocationToInactive = gql`
    mutation SetLocationToInactive($location: uuid!) {
      update_locations(where: {id: {_eq: $location}}, _set: {is_active: false}) {
        returning {
          id
          name
          is_active
        }
      }
    }
`