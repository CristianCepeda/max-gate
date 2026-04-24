import type { Business } from '@/types/business';
import type { OpenNDSParams } from '@/lib/opennds';

const GHL_API_BASE = 'https://services.leadconnectorhq.com';
const GHL_API_VERSION = '2021-07-28';

export interface LeadData {
  name: string;
  email: string;
  phone: string;
}

export async function pushToGHL(
  business: Business,
  leadData: LeadData,
  ndsParams: OpenNDSParams
): Promise<{ success: boolean; contactId?: string }> {
  const apiKey = process.env.GHL_PRIVATE_TOKEN;
  if (!apiKey) throw new Error('GHL_PRIVATE_TOKEN is not set');

  const firstName = leadData.name.split(' ')[0];
  const lastName = leadData.name.split(' ').slice(1).join(' ') || '';

  // Step 1: Create or update contact
  const contactRes = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: GHL_API_VERSION,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      firstName,
      lastName,
      email: leadData.email,
      phone: leadData.phone,
      locationId: business.ghl_location_id,
      tags: [business.ghl_tag, business.slug],
      source: 'MaxGate Portal',
      customFields: [
        { key: 'wifi_device_mac', field_value: ndsParams.clientmac },
        { key: 'wifi_capture_date', field_value: new Date().toISOString() },
      ],
    }),
  });

  if (!contactRes.ok) {
    const text = await contactRes.text();
    throw new Error(`GHL contact upsert failed (${contactRes.status}): ${text}`);
  }

  const contactData = await contactRes.json();
  const contactId = contactData?.contact?.id as string | undefined;

  // Step 2: Trigger workflow if configured
  if (business.ghl_workflow_id && contactId) {
    const workflowRes = await fetch(
      `${GHL_API_BASE}/contacts/${contactId}/workflow/${business.ghl_workflow_id}`,
      {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          Version: GHL_API_VERSION,
        },
      }
    );

    if (!workflowRes.ok) {
      // Log but don't throw — the contact was already created successfully
      console.error(
        `[MaxGate GHL] Workflow trigger failed for contactId=${contactId} workflowId=${business.ghl_workflow_id} status=${workflowRes.status}`
      );
    }
  }

  return { success: true, contactId };
}
