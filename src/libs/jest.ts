import { AppSyncResolverEvent } from 'aws-lambda';
import { v4 } from 'uuid';
import { UserInput } from '@type/index';

export const uuid = (): string => `unit-${v4()}`;
export const transform = <T>(args: T): AppSyncResolverEvent<T> => ({
  arguments: args,
  request: {
    headers: {},
  },
  info: {
    selectionSetList: [],
    selectionSetGraphQL: '',
    parentTypeName: '',
    fieldName: '',
    variables: {},
  },
});

export const studentSoy: UserInput<'STUDENT'> = {
  id: `soy-${v4()}`,
  name: 'Soy Sauce',
  avatar: null,
  role: 'STUDENT',
};

export const studentBarry: UserInput<'STUDENT'> = {
  id: `allen-${v4()}`,
  name: 'Barry Allen',
  avatar: null,
  role: 'STUDENT',
};

export const teacherMalala: UserInput<'TEACHER'> = {
  id: `malala-${v4()}`,
  name: 'Malala',
  avatar: null,
  role: 'TEACHER',
};

export const teacherSwift: UserInput<'TEACHER'> = {
  id: `swift-${v4()}`,
  name: 'Taylor Swift',
  avatar: null,
  role: 'TEACHER',
};

export default {};
