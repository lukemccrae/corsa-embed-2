# cloudfront caches are really aggressive,
# so we need to invalidate the cache after updating the JS bundle

aws cloudfront create-invalidation \
  --distribution-id E3QU6GKQWPL5GX \
  --paths "/*"