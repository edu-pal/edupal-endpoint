import { AppSyncResolverEvent } from 'aws-lambda';
import { v4 as uuid } from 'uuid';
import { ID, UserInput, AWSDateTime, User } from 'src/type/index';
import { docClient, mixpanel } from '@libs/setup';
import activeConnections from '@libs/activeConnections';
import {
  QuestionType,
  OptionsInput,
  AnswerInput,
  Options,
  Answer,
} from '../types';

export const handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<Question> => {
  const {
    meetingId,
    classId,
    type,
    image,
    text,
    options,
    answer,
    user,
  } = event.arguments.input;
  const { name, id } = user;

  if (['MCQ'].includes(type) && !options[type]) {
    throw new Error('Expected options to be non-null for MCQ.');
  }

  const questionDateTime = new Date().toISOString();
  const questionId = uuid();

  const putPromise = docClient
    .put({
      TableName: process.env.REALTIME_TABLE_NAME!,
      ConditionExpression: 'attribute_not_exists(sk)',
      Item: {
        pk: `MEETING${meetingId}`,
        sk: `Q#${questionId}#${questionDateTime}`,
        classId,
        question: {
          type,
          image,
          text,
          optionNum: type in options ? options[type]?.length : null,
          options,
          answer,
        },
        teacher: {
          name,
          id,
        },
      },
    })
    .promise();

  let numStudents: number;
  try {
    const response = await Promise.all([
      activeConnections(meetingId, docClient),
      putPromise,
    ]);
    numStudents = response[0]?.STUDENT ?? 0;
  } catch (error) {
    throw new Error(`Uncaught kaboom in DB put call: \n${error}`);
  }

  mixpanel.track('Ask Question', {
    distinct_id: id,
    $ip: event.identity?.sourceIp,
    meetingId,
    questionId,
    type,
    text,
    options,
    answer,
  });

  return {
    questionId,
    questionDateTime,
    numStudents,
    classId,
    meetingId,
    user,
    type,
    image,
    text,
    options,
    answer,
  };
};

export type QuestionInput = {
  classId: ID;
  meetingId: ID;
  user: UserInput<'TEACHER'>;
  type: QuestionType;
  image: string | null;
  text: string | null;
  options: OptionsInput;
  answer: AnswerInput | null;
};

export type Question = {
  questionId: ID;
  questionDateTime: AWSDateTime;
  numStudents: number;
  classId: ID;
  meetingId: ID;
  user: User<'TEACHER'>;
  type: QuestionType;
  image: string | null;
  text: string | null;
  options: Options;
  answer: Answer | null;
};

export type Arguments = { input: QuestionInput };
