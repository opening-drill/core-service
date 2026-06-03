/** The authenticated principal attached to a request — never carries the password. */
export interface AuthUser {
  id: string;
  username: string;
  full_name: string;
}
