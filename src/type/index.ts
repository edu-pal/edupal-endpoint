import { AWSURL } from './awsAppsync';

export type ID = string;
export type NullableString = string | null;
export type NullableNumber = number | null;
export type NullableBoolean = boolean | null;
export type Role = 'TEACHER' | 'STUDENT';

export interface UserInput<T = Role> {
  name: string;
  id: ID;
  avatar: AWSURL | null;
  role: T | Role;
}

export interface User<T = Role> {
  name: string;
  id: ID;
  avatar: AWSURL | null;
  role: T | Role;
}

export type ManualPromise = 'PENDING' | 'APPROVED' | 'REJECTED';

export * from './awsAppsync';
export default {};
