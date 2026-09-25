import { uploadImage } from "@/lib/upload-image";
import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * Coverage for the image-upload helper the company logo control depends on.
 *
 * The accepted change requires the file to be uploaded to the platform storage
 * and a *permanent* URL persisted — never an in-memory `blob:` object URL. This
 * file pins that contract at the helper seam: the bytes are pushed through
 * `StorageClient.putFile`, the resolved URL is the storage client's
 * `getDirectURL(hash)`, progress is forwarded, and a failure rejects instead of
 * degrading into a non-durable value.
 *
 * The storage transport is mocked; the real gateway is not exercised here.
 */

const loadConfigMock = vi.fn();
const fromBytesMock = vi.fn();
const putFileMock = vi.fn();
const getDirectURLMock = vi.fn();

vi.mock("@caffeineai/core-infrastructure", () => ({
  loadConfig: () => loadConfigMock(),
}));

vi.mock("@caffeineai/object-storage", () => ({
  ExternalBlob: {
    fromBytes: (...args: unknown[]) => fromBytesMock(...args),
  },
  StorageClient: class {
    putFile(...args: unknown[]) {
      return putFileMock(...args);
    }
    getDirectURL(...args: unknown[]) {
      return getDirectURLMock(...args);
    }
  },
}));

vi.mock("@icp-sdk/core/agent", () => ({
  HttpAgent: class {
    fetchRootKey() {
      return Promise.resolve();
    }
  },
}));

function imageFile(name = "logo.png", type = "image/png"): File {
  const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47]).buffer;
  const file = new File([bytes], name, { type });
  Object.defineProperty(file, "arrayBuffer", {
    value: () => Promise.resolve(bytes),
  });
  return file;
}

describe("uploadImage", () => {
  beforeEach(() => {
    loadConfigMock.mockReset();
    fromBytesMock.mockReset();
    putFileMock.mockReset();
    getDirectURLMock.mockReset();

    loadConfigMock.mockResolvedValue({
      backend_host: "https://icp.example.com",
      bucket_name: "bucket",
      storage_gateway_url: "https://gateway.example.com",
      backend_canister_id: "aaaaa-aa",
      project_id: "project-1",
    });
    fromBytesMock.mockReturnValue({
      getBytes: () => Promise.resolve(new Uint8Array([0x89, 0x50, 0x4e, 0x47])),
      contentType: "image/png",
      filename: "logo.png",
    });
    putFileMock.mockResolvedValue({ hash: "logo-hash" });
    getDirectURLMock.mockReturnValue(
      "https://gateway.example.com/logo-hash.png",
    );
  });

  it("uploads the bytes and resolves to the permanent gateway URL", async () => {
    const url = await uploadImage(imageFile());

    // The bytes were pushed to storage, and the URL is the gateway direct URL
    // for the returned hash — not an in-memory blob URL.
    expect(putFileMock).toHaveBeenCalledTimes(1);
    expect(getDirectURLMock).toHaveBeenCalledWith("logo-hash");
    expect(url).toBe("https://gateway.example.com/logo-hash.png");
    expect(url).not.toMatch(/^blob:/);
  });

  it("forwards upload progress to the caller", async () => {
    putFileMock.mockImplementation(
      (
        _bytes: Uint8Array,
        onProgress?: (percentage: number) => void,
      ): Promise<{ hash: string }> => {
        onProgress?.(42);
        return Promise.resolve({ hash: "logo-hash" });
      },
    );
    const onProgress = vi.fn();

    await uploadImage(imageFile(), onProgress);

    expect(onProgress).toHaveBeenCalledWith(42);
  });

  it("rejects when the upload fails instead of returning a blob URL", async () => {
    putFileMock.mockRejectedValue(new Error("gateway caído"));

    await expect(uploadImage(imageFile())).rejects.toThrow("gateway caído");
    // A failed upload never resolves a URL, so nothing non-durable is returned.
    expect(getDirectURLMock).not.toHaveBeenCalled();
  });
});
