export const domain = {
    appsync: process.env.NEXT_PUBLIC_APPSYNC_ENDPOINT ?? "https://tuy3ixkamjcjpc5fzo2oqnnyym.appsync-api.us-west-1.amazonaws.com/graphql",
    utilityApi: (process.env.NEXT_PUBLIC_UTILITY_API_ENDPOINT ?? "https://hpju2h9n7h.execute-api.us-west-1.amazonaws.com/prod/").replace(/\/$/, ""),
    geoJsonCdnBaseUrl: (process.env.NEXT_PUBLIC_GEOJSON_CDN_BASE_URL ?? "https://d2mg2mxj6r88wt.cloudfront.net").replace(/\/$/, ""),
    userImagesCdnBaseUrl: (process.env.NEXT_PUBLIC_USER_IMAGES_CDN_BASE_URL ?? "https://d2jr1um83mf5o7.cloudfront.net").replace(/\/$/, ""),
    postImagesCdnBaseUrl: (process.env.NEXT_PUBLIC_POST_IMAGES_CDN_BASE_URL ?? process.env.NEXT_PUBLIC_USER_IMAGES_CDN_BASE_URL ?? "https://d2jr1um83mf5o7.cloudfront.net").replace(/\/$/, ""),
}