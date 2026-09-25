import { loadConfig } from "@caffeineai/core-infrastructure";
import { ExternalBlob, StorageClient } from "@caffeineai/object-storage";
import { HttpAgent } from "@icp-sdk/core/agent";

/**
 * Sentinel the Motoko object-storage client prepends to a blob hash when it
 * crosses the Candid boundary. The backend strips it before building the
 * gateway URL, so the persisted `objectId` must carry it.
 */
const DEDUP_SENTINEL = "!caf!";

/** A storage client plus the agent that owns its certificate chain. */
interface StorageHandle {
  client: StorageClient;
  agent: HttpAgent;
  /** Gateway URL from `env.json`, forwarded to the backend for downloads. */
  gatewayUrl: string;
  /** Project id from `env.json`, forwarded to the backend for downloads. */
  projectId: string;
}

let handlePromise: Promise<StorageHandle> | null = null;

/**
 * Builds (once) the storage client the platform uses for uploads. The config
 * comes from the same `env.json` the actor reads, so the gateway URL, bucket
 * and project id always match the deployed environment.
 */
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
      return {
        client,
        agent,
        gatewayUrl: config.storage_gateway_url,
        projectId: config.project_id,
      };
    })().catch((error) => {
      // Allow a later attempt to rebuild the handle after a transient failure.
      handlePromise = null;
      throw error;
    });
  }
  return handlePromise;
}

/** Result of uploading one invoice file to platform storage. */
export interface UploadedInvoiceFile {
  /** Object id the backend stores and later resolves through the gateway. */
  objectId: string;
  fileName: string;
  mimeType: string;
  sizeBytes: bigint;
  /**
   * Storage gateway URL the upload used. The backend cannot read `env.json`,
   * so it must receive this to download the blob later.
   */
  gatewayUrl: string;
  /** Project id the upload used; the gateway rejects requests without it. */
  projectId: string;
}

/**
 * Uploads a purchase-invoice file to the platform file storage and returns the
 * reference the backend expects. Progress is reported from 0 to 100.
 *
 * The `ExternalBlob` is built with the file's MIME type and name so the gateway
 * stores `Content-Type` and `Content-Disposition`; the returned `objectId` is
 * the `!caf!`-prefixed hash the backend strips before fetching the bytes.
 */
export async function uploadInvoiceFile(
  file: File,
  onProgress: (percentage: number) => void,
): Promise<UploadedInvoiceFile> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  const blob = ExternalBlob.fromBytes(bytes, file.type, file.name);
  const { client, gatewayUrl, projectId } = await getStorageHandle();
  const { hash } = await client.putFile(
    await blob.getBytes(),
    onProgress,
    blob.contentType,
    blob.filename,
  );
  return {
    objectId: `${DEDUP_SENTINEL}${hash}`,
    fileName: file.name,
    mimeType: file.type,
    sizeBytes: BigInt(file.size),
    gatewayUrl,
    projectId,
  };
}
