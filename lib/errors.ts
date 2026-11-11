export class BusinessError extends Error {
  constructor(
    message: string,
    public fields: Record<string, string> = {},
    public status = 400,
  ) {
    super(message);
  }
}
export const fail = (
  message: string,
  fields: Record<string, string> = {},
): never => {
  throw new BusinessError(message, fields);
};
export const present = (v: any) =>
  v !== undefined && v !== null && String(v).trim() !== "";
export const positive = (v: any) =>
  present(v) && Number.isFinite(Number(v)) && Number(v) > 0;
export const integer = (v: any) =>
  present(v) && Number.isSafeInteger(Number(v));
export function required(
  data: any,
  keys: string[],
  message = "Không được để trống!",
) {
  const fields: Record<string, string> = {};
  keys.forEach((k) => {
    if (!present(data[k])) fields[k] = message;
  });
  if (Object.keys(fields).length) fail(message, fields);
}
