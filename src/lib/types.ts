export type Mural = {
  id: string;
  owner_id: string;
  slug: string;
  name: string;
  requires_approval: boolean;
  created_at: string;
};

export type Photo = {
  id: string;
  mural_id: string;
  uploader_name: string;
  caption: string | null;
  storage_path: string;
  approved: boolean;
  created_at: string;
};

export type PhotoWithUrl = Photo & { url: string };
