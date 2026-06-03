/** Builds an HTTP Basic `Authorization` header value. */
export function basicHeader(username: string, password: string): string {
  const token = Buffer.from(`${username}:${password}`).toString('base64');
  return `Basic ${token}`;
}
