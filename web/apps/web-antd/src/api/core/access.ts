import { requestClient } from '../request';

export interface AccessCredentialPayload {
  experimentId: string;
}

export interface AccessCredentialResp {
  url: string;
  password: string;
  expiresAt?: string;
}

export function generateAccessCredentialApi(
  payload: AccessCredentialPayload,
): Promise<AccessCredentialResp> {
  return requestClient.post('/access/credentials/generate', payload);
}

export function getAccessCredentialApi(
  payload: AccessCredentialPayload,
): Promise<AccessCredentialResp> {
  return requestClient.post('/access/credentials/get', payload);
}