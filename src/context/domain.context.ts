export const domain = {
    appsync: import.meta.env.VITE_APPSYNC_ENDPOINT ?? "https://tuy3ixkamjcjpc5fzo2oqnnyym.appsync-api.us-west-1.amazonaws.com/graphql",
    utilityApi: (import.meta.env.VITE_UTILITY_API_ENDPOINT ?? "https://hpju2h9n7h.execute-api.us-west-1.amazonaws.com/prod/").replace(/\/$/, ""),
    geoJsonCdnBaseUrl: (import.meta.env.VITE_GEOJSON_CDN_BASE_URL ?? "https://d2mg2mxj6r88wt.cloudfront.net").replace(/\/$/, ""),
    userImagesCdnBaseUrl: (import.meta.env.VITE_USER_IMAGES_CDN_BASE_URL ?? "https://d2jr1um83mf5o7.cloudfront.net").replace(/\/$/, ""),
    postImagesCdnBaseUrl: (import.meta.env.VITE_POST_IMAGES_CDN_BASE_URL ?? import.meta.env.VITE_USER_IMAGES_CDN_BASE_URL ?? "https://d2jr1um83mf5o7.cloudfront.net").replace(/\/$/, ""),
}