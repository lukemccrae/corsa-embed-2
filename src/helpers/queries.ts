// GraphQL query strings for the stream page, following the corsa-next pattern.
// A single query fetches user profile + a specific live stream in one round-trip.

/**
 * Fetches the user profile and the specified live stream (including waypoints,
 * chat messages, and posts) using the getUserByUserName + liveStreams(streamId)
 * pattern from corsa-next.
 *
 * NOTE: `username` and `streamId` are interpolated directly into the query
 * string to match the corsa-next resolver — both values come from trusted
 * component props, not end-user input, so injection risk is minimal.
 */
export const STREAM_PROFILE_QUERY = (
  username: string,
  streamId: string
) => /* GraphQL */ `
  query MyQuery {
    getUserByUserName(username: "${username}") {
      username
      profilePicture
      coverImagePath
      streamId
      bio
      live
      liveStreams(streamId: "${streamId}") {
        streamId
        mileMarker
        title
        timezone
        startTime
        finishTime
        live
        currentLocation {
          lat
          lng
        }
        chatMessages {
          text
          createdAt
          streamId
          userId
          publicUser {
            username
            profilePicture
          }
        }
        device {
          make
        }
        route {
          routeId
          name
          storagePath
          overlayPath
        }
        waypoints {
          lat
          lng
          altitude
          mileMarker
          timestamp
          streamId
          private
        }
        posts {
          createdAt
          type
          userId
          location {
            lat
            lng
          }
          ... on StatusPost {
            text
            imagePath
            createdAt
            userId
            location {
              lat
              lng
            }
          }
        }
      }
    }
  }
`;

/** Real-time subscription for new chat messages on a live stream. */
export const ON_NEW_CHAT = /* GraphQL */ `
  subscription OnNewChat($streamId: ID!) {
    onNewChat(streamId: $streamId) {
      text
      createdAt
      streamId
      userId
      publicUser {
        username
        profilePicture
      }
    }
  }
`;

/** Real-time subscription for new GPS waypoints on a live stream. */
export const ON_NEW_WAYPOINT = /* GraphQL */ `
  subscription OnNewWaypoint($streamId: ID!) {
    onNewWaypoint(streamId: $streamId) {
      lat
      lng
      altitude
      mileMarker
      timestamp
      streamId
      private
    }
  }
`;

/**
 * Fetches route metadata for a given user, used by the route embed.
 * Pass the routeId to filter the desired route on the client side.
 */
export const ROUTE_QUERY = (username: string) => /* GraphQL */ `
  query GetUserRoutes {
    getUserByUserName(username: "${username}") {
      username
      profilePicture
      routes {
        routeId
        name
        storagePath
        overlayPath
        distanceInMiles
        gainInFeet
        uom
      }
    }
  }
`;
