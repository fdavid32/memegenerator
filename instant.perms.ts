import type { InstantRules } from '@instantdb/core';

const rules = {
  memes: {
    allow: {
      view: 'true',
      create: 'isLoggedIn',
    },
    bind: {
      isLoggedIn: 'auth.id != null',
    },
  },
  votes: {
    allow: {
      view: 'true',
      create: 'isLoggedIn',
      delete: 'isLoggedIn',
    },
    bind: {
      isLoggedIn: 'auth.id != null',
    },
  },
  $files: {
    allow: {
      view: 'true',
      create: 'isLoggedIn',
    },
    bind: {
      isLoggedIn: 'auth.id != null',
    },
  },
} satisfies InstantRules;

export default rules;
