import { cameras, shapeCameras, handleResource } from './_lib/upstream.js';

export default async function handler(_req, res) {
  await handleResource(cameras, shapeCameras, res);
}
