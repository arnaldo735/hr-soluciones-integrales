import { loadConfig } from "@caffeineai/core-infrastructure";
import { ExternalBlob, StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";

/**
 * Uploads an image to the platform file storage and returns a permanent URL
 * that can be persisted and rendered later.
 *
 * `ExternalBlob.fromBytes` alone only produces an in-memory `blob:` object URL,
 * which dies with the page and cannot be stored. The bytes must be pushed to the
 * storage gateway through `StorageClient.putFile`, and the URL the backend and
 * the browser can both resolve is the gateway direct URL for the returned hash.
 */

interface StorageHandle {
  client: StorageClient;
  agent: HttpAgent;
}

let handlePromise: Promise<StorageHandle> | null = null;

/** How long to wait for the deployment config before giving up on the upload. */
const CONFIG_TIMEOUT_MS = 3000;

/**
 * Rejects when `promise` does not settle within `ms`, or when it rejects. The
 * rejection is never swallowed: a failed upload must surface to the caller
 * instead of degrading into a non-durable value.
 */
function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(
      () =>
        reject(
          new Error(
            "No se pudo preparar el almacenamiento de archivos. Verifica tu conexión e inténtalo de nuevo.",
          ),
        ),
      ms,
    );
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });
}

/** Builds (once) the storage client for the deployed environment. */
async function getStorageHandle(): Promise<StorageHandle> {
  if (!handlePromise) {
    handlePromise = (async () => {
      const config = await loadConfig();
      const agent = new HttpAgent({ host: config.backend_host });
      if (config.backend_host?.includes("localhost")) {
        await agent.fetchRootKey().catch(() => {
          // Local replica without a root key: uploads still work over HTTP.
        });
      }
      const client = new StorageClient(
        config.bucket_name,
        config.storage_gateway_url,
        config.backend_canister_id,
        config.project_id,
        agent,
      );
      return { client, agent };
    })().catch((error) => {
      // Allow a later attempt to rebuild the handle after a transient failure.
      handlePromise = null;
      throw error;
    });
  }
  return handlePromise;
}

/**
 * Uploads one image file and resolves to its permanent storage URL. Progress is
 * reported from 0 to 100.
 *
 * The bytes are pushed to the platform storage gateway and the returned URL is
 * the gateway direct URL for the stored hash, which survives reloads and can be
 * rendered by the browser and read by the backend. When the deployment config
 * cannot be resolved the upload rejects: the caller persists the returned URL,
 * so a non-durable `blob:` object URL must never be returned in its place.
 */
export async function uploadImage(
  file: File,
  onProgress?: (percentage: number) => void,
): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
  const handle = await withTimeout(getStorageHandle(), CONFIG_TIMEOUT_MS);
  const { hash } = await handle.client.putFile(
    await blob.getBytes(),
    onProgress,
    blob.contentType,
    blob.filename,
  );
  return handle.client.getDirectURL(hash);
}
