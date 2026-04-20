import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BUCKET = "appliance-models";

export async function createGLBSignedUploadUrl(
  propertyId: string,
  applianceId: string
): Promise<{ signedUrl: string; path: string }> {
  const supabase = getServiceClient();
  const path = `${propertyId}/${applianceId}/model.glb`;

  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUploadUrl(path, { upsert: true });

  if (error || !data) throw new Error(error?.message ?? "Error generando URL firmada");

  return { signedUrl: data.signedUrl, path };
}

export function getGLBPublicUrl(propertyId: string, applianceId: string): string {
  const supabase = getServiceClient();
  const path = `${propertyId}/${applianceId}/model.glb`;
  const { data } = supabase.storage.from(BUCKET).getPublicUrl(path);
  return data.publicUrl;
}

const INCIDENT_PHOTOS_BUCKET = "incident-photos";

export async function uploadIncidentPhoto(
  propertyId: string,
  photoBuffer: Buffer,
  mimeType: string
): Promise<string> {
  const supabase = getServiceClient();
  const ext = mimeType.includes("png") ? "png" : mimeType.includes("gif") ? "gif" : "jpg";
  const path = `${propertyId}/${Date.now()}.${ext}`;

  const { error } = await supabase.storage
    .from(INCIDENT_PHOTOS_BUCKET)
    .upload(path, photoBuffer, { contentType: mimeType, upsert: false });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(INCIDENT_PHOTOS_BUCKET).getPublicUrl(path);
  return data.publicUrl;
}
