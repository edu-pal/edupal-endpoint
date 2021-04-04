import { AppSyncResolverEvent } from 'aws-lambda';
import {
  ID,
  UserInput,
  AWSDateTime,
  User,
  NullableBoolean,
} from 'src/type/index';
import { mixpanel, docClient } from '@libs/setup';
import { AnswerInput, Answer, QuestionType } from '../types';

const arrayEqual = <T>(a: T[], b: T[]): boolean =>
  a.length === b.length && a.every((el, i) => el === b[i]);
const trim = (str: string): string =>
  str
    .replace(/[!#$%&()*,./:;<=>?\\^_`{}~-]/g, '')
    .trim()
    .replace(/\s+/g, ' ');

export const handler = async (
  event: AppSyncResolverEvent<Arguments>
): Promise<Response> => {
  const {
    meetingId,
    questionId,
    classId,
    answerer,
    theirAnswer,
    type,
    answer,
    questionDateTime,
  } = event.arguments.input;
  const { id, name } = answerer;
  const respondDateTime = new Date().toISOString();

  if (!theirAnswer[type]) {
    throw new Error(
      'Expected theirAnswer[type] to be non-null. Please supply response.'
    );
  }

  let isCorrect: NullableBoolean;
  if (answer === null || answer[type] === null) {
    isCorrect = null;
  } else {
    switch (type) {
      case 'MCQ':
        // By-element array comparision
        isCorrect = arrayEqual(answer.MCQ!, theirAnswer.MCQ!);
        break;
      case 'TrueFalse':
        isCorrect = arrayEqual(answer.TrueFalse!, theirAnswer.TrueFalse!);
        break;
      case 'ShortAnswer':
        isCorrect =
          trim(answer.ShortAnswer!) === trim(theirAnswer.ShortAnswer!);
        break;
      default:
        isCorrect = null;
        break;
    }
  }

  // Simplified binary points system, make complex later
  const coinsEarned = Number(isCorrect);
  const pk = `MEETING#${meetingId}`;
  const PutParams = (sk: string): Record<string, unknown> => ({
    Put: {
      TableName: process.env.REALTIME_TABLE_NAME,
      ConditionExpression: 'attribute_not_exists(sk)',
      Item: {
        pk,
        sk,
        classId,
        response: {
          theirAnswer: theirAnswer[type],
          isCorrect,
          coinsEarned,
          respondDateTime,
        },
        answerer: {
          name,
          id,
        },
      },
    },
  });

  // If isCorrect is null then is ungraded, should not reset streak
  const switcher = isCorrect === false;
  try {
    await docClient
      .transactWrite({
        TransactItems: [
          {
            Update: {
              TableName: process.env.REALTIME_TABLE_NAME,
              Key: { pk, sk: `USER#STUDENT#${meetingId}#${id}` },
              ExpressionAttributeValues: {
                ':change': coinsEarned,
                // :inc increments one if correct, zero if null (ungraded)
                ...(switcher ? { ':zero': 0 } : { ':inc': Number(isCorrect) }), // Else dynamo complains about unused variables
              },
              UpdateExpression: `ADD coinTotal :change${
                switcher
                  ? '  SET game.correctStreak = :zero,'
                  : ', game.correctStreak :inc  SET'
              } game.coinChange = :change`,
              ConditionExpression: 'attribute_exists(sk)',
              ReturnValues: 'ALL_NEW',
            },
          },
          PutParams(`RES#${id}#${questionDateTime}#${questionId}`),
          PutParams(`RES#${questionDateTime}#${questionId}#${id}`),
          PutParams(`RES#${questionId}#${questionDateTime}#${id}`),
        ],
      })
      .promise();
  } catch (error) {
    throw new Error(`Uncaught DynamoDB transactWrite error: ${error}`);
  }

  mixpanel.track('Send Response', {
    distinct_id: id,
    $ip: event.identity?.sourceIp,
    meetingId,
    answerer,
    questionId,
    theirAnswer,
  });

  return {
    meetingId,
    questionId,
    questionDateTime,
    answerer,
    type,
    theirAnswer,
    respondDateTime,
    isCorrect,
    coinsEarned,
  };
};

export type ResponseInput = {
  classId: ID;
  meetingId: ID;
  questionId: ID;
  questionDateTime: AWSDateTime;
  answerer: UserInput<'STUDENT'>;
  type: QuestionType;
  answer: AnswerInput | null;
  theirAnswer: AnswerInput;
};

export type Response = {
  meetingId: ID;
  questionId: ID;
  questionDateTime: AWSDateTime;
  answerer: User<'STUDENT'>;
  type: QuestionType;
  theirAnswer: Answer;
  respondDateTime: AWSDateTime;
  isCorrect: NullableBoolean;
  coinsEarned: number;
};

export type Arguments = { input: ResponseInput };
