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

export const UpdateLocationGeofenceRadius = gql`
    mutation UpdateGeofence($location: uuid!, $radius: Int!) {
      update_locations(where: {id: {_eq: $location}}, 
        _set: {geofence_radius: $radius}) {
        returning {
          id
          name
          latitude
          longitude
          geofence_radius
        }
      }
    }
`

export const UpdateLocationLatLong = gql`
    mutation UpdateLatLong($location: uuid!, $latitude: float8!, $longitude: float8!) {
      update_locations(where: {id: {_eq: $location}}, _set: {latitude: $latitude, longitude: $longitude}) {
        returning {
          id
          name
          latitude
          longitude
          geofence_radius
        }
      }
    }
`