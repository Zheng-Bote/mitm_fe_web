export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  department: string | null;
  email: string | null;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
}
