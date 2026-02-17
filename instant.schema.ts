import { i } from '@instantdb/core';

const _schema = i.schema({
  entities: {
    $files: i.entity({
      path: i.string().unique().indexed(),
      url: i.string(),
    }),
    $users: i.entity({
      email: i.string().unique().indexed().optional(),
    }),
    memes: i.entity({
      createdAt: i.date().indexed(),
    }),
    votes: i.entity({
      createdAt: i.date(),
    }),
  },
  links: {
    memeImage: {
      forward: { on: 'memes', has: 'one', label: 'image' },
      reverse: { on: '$files', has: 'one', label: 'meme' },
    },
    memeCreator: {
      forward: { on: 'memes', has: 'one', label: 'creator' },
      reverse: { on: '$users', has: 'many', label: 'memes' },
    },
    voteMeme: {
      forward: { on: 'votes', has: 'one', label: 'meme' },
      reverse: { on: 'memes', has: 'many', label: 'votes' },
    },
    voteUser: {
      forward: { on: 'votes', has: 'one', label: 'user' },
      reverse: { on: '$users', has: 'many', label: 'votes' },
    },
  },
});

type _AppSchema = typeof _schema;
interface AppSchema extends _AppSchema {}
const schema: AppSchema = _schema;

export type { AppSchema };
export default schema;
