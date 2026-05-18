import { useResource } from './useResource.js';

export function useCameras(intervalMs) {
  return useResource('/api/cameras', intervalMs);
}
