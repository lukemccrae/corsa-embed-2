# cloudfront caches are really aggressive,
# so we need to invalidate the cache after updating the JS bundle

export AWS_PROFILE=prod

aws cloudfront create-invalidation \
  --distribution-id E3QU6GKQWPL5GX \
  --paths "/*" \
  --no-cli-pager

echo "✅ CloudFront cache invalidation request submitted successfully."