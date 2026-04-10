import { randomUUID } from 'crypto';

function getErrorText(error) {
  return [error?.message, error?.details, error?.hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
}

export function isMissingRelationError(error, relationName = '') {
  const message = getErrorText(error);
  const relation = relationName.toLowerCase();

  if (error?.code === '42P01') {
    return !relation || message.includes(relation);
  }

  return message.includes('does not exist') && (!relation || message.includes(relation));
}

export function isMissingColumnError(error, columnName) {
  const message = getErrorText(error);
  const column = columnName.toLowerCase();

  if (error?.code === '42703') {
    return message.includes(column);
  }

  return message.includes('column') && message.includes(column) && message.includes('does not exist');
}

function stripField(payload, fieldName) {
  if (Array.isArray(payload)) {
    return payload.map((record) => {
      const nextRecord = { ...record };
      delete nextRecord[fieldName];
      return nextRecord;
    });
  }

  const nextRecord = { ...payload };
  delete nextRecord[fieldName];
  return nextRecord;
}

function ensureInsertIds(payload) {
  if (Array.isArray(payload)) {
    return payload.map((record) => (
      record?.id ? record : { id: randomUUID(), ...record }
    ));
  }

  return payload?.id ? payload : { id: randomUUID(), ...payload };
}

export async function insertRfqRecipients(supabaseClient, records) {
  const fallbackFields = ['status', 'recipient_type', 'match_score', 'match_reasons'];
  let payload = ensureInsertIds(records);
  let fallbackUsed = false;

  for (;;) {
    const { error } = await supabaseClient.from('rfq_recipients').insert(payload);

    if (!error) {
      return { error: null, fallbackUsed };
    }

    const removableField = fallbackFields.find((field) => isMissingColumnError(error, field));
    if (!removableField) {
      return { error, fallbackUsed };
    }

    payload = stripField(payload, removableField);
    fallbackUsed = true;
  }
}

export async function updateRfqRecipientStatus(supabaseClient, rfqId, vendorId, status) {
  const { error } = await supabaseClient
    .from('rfq_recipients')
    .update({ status })
    .eq('rfq_id', rfqId)
    .eq('vendor_id', vendorId);

  if (!error || isMissingColumnError(error, 'status')) {
    return { error: null, skipped: Boolean(error) };
  }

  return { error, skipped: false };
}

export async function insertRfqRequests(supabaseClient, records) {
  const fallbackFields = ['project_title', 'project_description', 'user_id'];
  let payload = ensureInsertIds(records);
  let fallbackUsed = false;

  for (;;) {
    const { error } = await supabaseClient.from('rfq_requests').insert(payload);

    if (!error) {
      return { error: null, fallbackUsed };
    }

    const removableField = fallbackFields.find((field) => isMissingColumnError(error, field));
    if (!removableField) {
      return { error, fallbackUsed };
    }

    payload = stripField(payload, removableField);
    fallbackUsed = true;
  }
}

export async function insertAdminAudit(supabaseClient, records) {
  const { error } = await supabaseClient.from('rfq_admin_audit').insert(records);

  if (!error || isMissingRelationError(error, 'rfq_admin_audit')) {
    return { error: null, skipped: Boolean(error) };
  }

  return { error, skipped: false };
}