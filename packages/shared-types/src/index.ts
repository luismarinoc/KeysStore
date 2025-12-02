export type TabCategory = 'APP' | 'WIFI' | 'VPN' | 'NOTE';
export type Environment = 'DEV' | 'QAS' | 'PRD' | 'NONE';
export type OrganizationRole = 'OWNER' | 'ADMIN' | 'MEMBER';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  created_at: string;
}

export interface OrganizationMember {
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
}

export interface Project {
  id: string;
  user_id: string;
  organization_id?: string; // Optional during migration
  name: string;
  logo_url?: string;
  api_key?: string;
  pc_name?: string;
  created_at?: string;
  is_synced?: boolean;
}

export interface Credential {
  id: string;
  user_id: string;
  project_id: string;
  organization_id?: string; // Optional during migration
  tab_category: TabCategory;
  environment: Environment;
  title: string;
  username?: string;
  password_encrypted?: string;
  host_address?: string;
  saprouter_string?: string;
  ssid?: string;
  psk_encrypted?: string;
  note_content?: string;
  instance_number?: string;
  mandt?: string;
  api_key?: string;
  pc_name?: string;
  created_at?: string;
  is_synced?: boolean;
}
