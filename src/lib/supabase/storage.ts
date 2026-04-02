import { createClient } from "@supabase/supabase-js";

function getServiceClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );
}

const BUCKET = "appliance-models";

export async function uploadGLB(
  file: File,
  propertyId: string,
  applianceId: string
): Promise<string> {
  const supabase = getServiceClient();
  const fileName = `${propertyId}/${applianceId}/model.glb`;

  const bytes = await file.arrayBuffer();
  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, bytes, {
      contentType: "model/gltf-binary",
      upsert: true,
    });

  if (error) throw new Error(error.message);

  const { data } = supabase.storage.from(BUCKET).getPublicUrl(fileName);
  return data.publicUrl;
}
