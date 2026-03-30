import type { User } from "../generated/schema";
import { domain } from "../context/domain.context";

const FALLBACK_COVER_IMAGE = "https://i.imgur.com/pVsCWkO.png";

/**
 * Returns the best available cover image URL for a user.
 * Prefers `coverImagePath` when present, falls back to the default cover image.
 */
export function getCoverImageUrl(user: Pick<User, "coverImagePath">): string {
  return user.coverImagePath
    ? `${domain.userImagesCdnBaseUrl}/${user.coverImagePath}`
    : FALLBACK_COVER_IMAGE;
}

export function getProfilePictureUrl(
  user: Pick<User, "profilePicture">,
): string {
  return `${domain.userImagesCdnBaseUrl}/${user.profilePicture}`;
}

/**
 * Returns the public CloudFront URL for a post image given its S3 object key.
 */
export function getPostImageUrl(objectKey: string): string {
  return `${domain.postImagesCdnBaseUrl}/${objectKey}`;
}
