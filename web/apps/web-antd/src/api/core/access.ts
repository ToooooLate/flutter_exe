import { requestClient } from '../request';

export interface AccessCredentialPayload {
  username: string;
  end?: number;
}

export interface AccessCredentialResp {
  url: string;
  password: string;
  begin?: number;
  end?: number;
}

export function generateAccessCredentialApi(
  payload: AccessCredentialPayload,
): Promise<AccessCredentialResp> {
  return requestClient.post('/api/sg/user/addTemporary', payload);
}

export function getAccessCredentialApi(
  payload: AccessCredentialPayload,
): Promise<AccessCredentialResp> {
  return requestClient.post('/api/sg/user/getTemporary', payload);
}