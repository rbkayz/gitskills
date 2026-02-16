import fs from "node:fs";
import path from "node:path";
import { Storage } from "@google-cloud/storage";

export type TarballUploadResult = {
  tarballUrl: string;
  backend: "local" | "gcs";
};

function gcsConfig() {
  const bucket = process.env.GCS_BUCKET?.trim();
  if (!bucket) return null;
  const projectId = process.env.GCP_PROJECT_ID?.trim() || undefined;
  const keyFilename = process.env.GOOGLE_APPLICATION_CREDENTIALS?.trim() || undefined;
  const publicBaseUrl =
    process.env.GCS_PUBLIC_BASE_URL?.trim() || `https://storage.googleapis.com/${bucket}`;
  return { bucket, projectId, keyFilename, publicBaseUrl };
}

export async function uploadTarball(params: {
  slug: string;
  version: string;
  bytes: Buffer;
}): Promise<TarballUploadResult> {
  const gcs = gcsConfig();
  const objectPath = `skills/${params.slug}/${params.version}.tgz`;

  if (gcs) {
    const storage = new Storage({
      projectId: gcs.projectId,
      keyFilename: gcs.keyFilename
    });
    const bucket = storage.bucket(gcs.bucket);
    const file = bucket.file(objectPath);
    await file.save(params.bytes, {
      resumable: false,
      contentType: "application/gzip",
      metadata: { cacheControl: "public, max-age=31536000, immutable" }
    });
    if ((process.env.GCS_MAKE_PUBLIC ?? "").trim() === "1") {
      await file.makePublic();
    }
    return {
      tarballUrl: `${gcs.publicBaseUrl.replace(/\/+$/, "")}/${objectPath}`,
      backend: "gcs"
    };
  }

  const storageRoot = process.env.LOCAL_STORAGE_DIR
    ? path.resolve(process.env.LOCAL_STORAGE_DIR)
    : path.join(process.cwd(), "public", "tarballs");
  const storageDir = path.join(storageRoot, params.slug);
  fs.mkdirSync(storageDir, { recursive: true });
  const filePath = path.join(storageDir, `${params.version}.tgz`);
  fs.writeFileSync(filePath, params.bytes);
  return {
    tarballUrl: `/tarballs/${params.slug}/${params.version}.tgz`,
    backend: "local"
  };
}

