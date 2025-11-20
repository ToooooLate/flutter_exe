import { requestClient } from '../request';

export interface AccessCredentialPayload {
  username: string;
  end: number;
}

export interface AccessCredentialResp {
  url: string;
  password: string;
  expiresAt?: string;
}

export function generateAccessCredentialApi(
  payload: AccessCredentialPayload,
): Promise<AccessCredentialResp> {
  return requestClient.post('/api/sg/user/addTemporary', payload);
}

export function getAccessCredentialApi(
  payload: AccessCredentialPayload,
): Promise<AccessCredentialResp> {
  return requestClient.post('/access/credentials/get', payload);
}