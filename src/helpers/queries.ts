// GraphQL query/mutation/subscription strings for the stream page

export const GET_PROFILE_BY_USERNAME = /* GraphQL */ `
  query GetProfileByUsername($username: String!) {
    getProfileByUsername(username: $username) {
      id
      username
      displayName
      bio
      avatarKey
      totalDistance
      totalActivities
      followerCount
      followingCount
    }
  }
`;

export const GET_STREAM = /* GraphQL */ `
  query GetStream($streamId: ID!) {
    getStream(id: $streamId) {
      id
      title
      description
      status
      startTime
      endTime
      distance
      duration
      elevationGain
      userId
      username
      coverImageKey
      coordinates {
        lat
        lng
        elevation
        timestamp
        heartRate
        pace
        cadence
      }
      posts {
        items {
          id
          content
          imageKey
          createdAt
          authorUsername
          authorDisplayName
          authorAvatarKey
          likeCount
        }
      }
    }
  }
`;

export const GET_STREAM_CHAT = /* GraphQL */ `
  query GetStreamChat($streamId: ID!, $nextToken: String) {
    getStreamChat(streamId: $streamId, nextToken: $nextToken) {
      items {
        id
        streamId
        authorUsername
        authorDisplayName
        authorAvatarKey
        message
        createdAt
      }
      nextToken
    }
  }
`;

export const ON_NEW_CHAT_MESSAGE = /* GraphQL */ `
  subscription OnNewChatMessage($streamId: ID!) {
    onNewChatMessage(streamId: $streamId) {
      id
      streamId
      authorUsername
      authorDisplayName
      authorAvatarKey
      message
      createdAt
    }
  }
`;

export const ON_STREAM_COORDINATE_ADDED = /* GraphQL */ `
  subscription OnStreamCoordinateAdded($streamId: ID!) {
    onStreamCoordinateAdded(streamId: $streamId) {
      streamId
      lat
      lng
      elevation
      timestamp
      heartRate
      pace
      cadence
    }
  }
`;

export const ON_STREAM_UPDATED = /* GraphQL */ `
  subscription OnStreamUpdated($streamId: ID!) {
    onStreamUpdated(id: $streamId) {
      id
      status
      distance
      duration
      elevationGain
    }
  }
`;
