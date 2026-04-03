export interface SharedCapturePayload {
  rawOcrText: string;
  userNote?: string;
  createdAt: number;
}

export async function writeSharedCapture(payload: SharedCapturePayload) {
  return payload;
}
