import 'fake-indexeddb/auto';
import { beforeEach } from 'vitest';
import { resetDB } from '../src/db';

beforeEach(async () => {
  await resetDB();
});
