export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  department: string | null;
  email: string | null;
  is_active: boolean;
}

/** A user with its assigned role ids, as returned by `GET /api/v1/iam/users/:id`. */
export interface UserDetail extends User {
  role_ids: number[];
}

export interface Role {
  id: number;
  name: string;
}
