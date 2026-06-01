import { exceedsCloudflareAnimatedImageLimit, getImageAnimationInfo } from "./animation";
import { createImageResponse } from "./image-responses";
import { getOriginalImageResponse, shouldPrecheckForAnimation } from "./image-source";

export async function getAnimationPrecheckResponse(
  imageURL: string,
  request: Request,
): Promise<Response | null> {
  if (!shouldPrecheckForAnimation(imageURL)) return null;

  const response = await getOriginalImageResponse(imageURL, request);
  if (!response.ok) return createImageResponse(response);

  const bytes = await response.arrayBuffer();
  const animationInfo = getImageAnimationInfo(bytes);

  if (animationInfo && exceedsCloudflareAnimatedImageLimit(animationInfo)) {
    return createImageResponse(response, bytes);
  }

  return null;
}
