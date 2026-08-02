import { useResource } from './useResource.js';

export function useCameras(intervalMs) {
  return useResource(`${import.meta.env.BASE_URL}api/cameras`, intervalMs);
}
