export interface Business {
  id: string;
  slug: string;
  name: string;
  logo_url: string | null;
  primary_color: string;
  secondary_color: string;
  welcome_message: string;
  terms_text: string | null;
  redirect_url: string | null;
  ghl_location_id: string;
  ghl_tag: string;
  ghl_workflow_id: string | null;
  router_mac: string | null;
  faskey: string;
  session_timeout: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}
