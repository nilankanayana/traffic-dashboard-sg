import { useResource } from './useResource.js';

export function useTaxis(intervalMs) {
  return useResource('/api/taxis', intervalMs);
}
