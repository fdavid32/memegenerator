import { init, id } from '@instantdb/core';
import schema from '../instant.schema';

const APP_ID = import.meta.env.VITE_INSTANT_APP_ID;
if (!APP_ID) throw new Error('Missing VITE_INSTANT_APP_ID');

export const db = init({
  appId: APP_ID,
  schema,
  useDateObjects: false,
});

export { id };
