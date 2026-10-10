export interface User {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  is_active: boolean;
}

export interface Role {
  id: number;
  name: string;
}
