import type { Business } from "@/types/business";
import type { OpenNDSParams } from "@/lib/opennds";

const GHL_API_BASE = "https://services.leadconnectorhq.com";
const GHL_API_VERSION = "2021-07-28";

export interface LeadData {
  name: string;
  email: string;
}

export async function pushToGHL(
  business: Business,
  leadData: LeadData,
  ndsParams: OpenNDSParams,
): Promise<{ success: boolean; contactId?: string }> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) throw new Error("GHL_API_KEY is not set");

  const firstName = leadData.name.split(" ")[0];
  const lastName = leadData.name.split(" ").slice(1).join(" ") || "";

  const headers = {
    Authorization: `Bearer ${apiKey}`,
    Version: GHL_API_VERSION,
    "Content-Type": "application/json",
  };

  const payload = {
    firstName,
    lastName,
    email: leadData.email,
    locationId: business.ghl_location_id,
    tags: [business.ghl_tag, business.slug],
    source: "MaxGate Portal",
    customFields: [
      { key: "wifi_device_mac", field_value: ndsParams.clientmac },
      { key: "wifi_capture_date", field_value: new Date().toISOString() },
    ],
  };

  // Step 1: Try to create contact
  const contactRes = await fetch(`${GHL_API_BASE}/contacts/`, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  });

  let contactId: string | undefined;

  // GHL returns 400 with meta.contactId when the contact already exists.
  // PUT /contacts/{id} updates it — locationId is not allowed on update.
  if (contactRes.status === 400) {
    const errBody = (await contactRes.json()) as {
      meta?: { contactId?: string };
      message?: string;
    };
    const existingId = errBody?.meta?.contactId;

    if (!existingId) {
      throw new Error(
        `GHL contact create failed (400): ${JSON.stringify(errBody)}`,
      );
    }

    const { locationId: _omit, ...updatePayload } = payload;
    const updateRes = await fetch(
      `${GHL_API_BASE}/contacts/${existingId}`,
      {
        method: "PUT",
        headers,
        body: JSON.stringify(updatePayload),
      },
    );

    if (!updateRes.ok) {
      const text = await updateRes.text();
      throw new Error(
        `GHL contact update failed (${updateRes.status}): ${text}`,
      );
    }

    contactId = existingId;
  } else if (!contactRes.ok) {
    const text = await contactRes.text();
    throw new Error(
      `GHL contact upsert failed (${contactRes.status}): ${text}`,
    );
  } else {
    const contactData = (await contactRes.json()) as {
      contact?: { id?: string };
      id?: string;
    };
    contactId = contactData?.contact?.id ?? contactData?.id;
  }

  return { success: true, contactId };
}
