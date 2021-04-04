import { NullableString } from 'src/type/index';

export type QuestionType = 'MCQ' | 'TrueFalse' | 'ShortAnswer';

// Is undefined when it's not that question type
// Is null when is that question type but teacher left it intentionally blank
export type AnswerInput = {
  MCQ?: boolean[] | null;
  TrueFalse?: [boolean, boolean] | null;
  ShortAnswer?: string | null;
};

export type Answer = {
  MCQ?: boolean[] | null;
  TrueFalse?: [boolean, boolean] | null;
  ShortAnswer?: string | null;
};

export type OptionsInput = {
  MCQ?: NullableString[];
  TrueFalse?: [boolean, boolean];
  ShortAnswer?: null;
};

export type Options = {
  MCQ?: NullableString[];
  TrueFalse?: [boolean, boolean];
  ShortAnswer?: null;
};
