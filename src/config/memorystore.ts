import { Mutex } from 'async-mutex';

export const memoryStore = new Map<string, any>();
const mutex = new Mutex();

export const setValue = async (key: string, value: any): Promise<void> => {
  const release = await mutex.acquire();
  try {
    memoryStore.set(key, value);
  } finally {
    release();
  }
}

export const getValue = async (key: string): Promise<any> => {
  const release = await mutex.acquire();
  try {
    return memoryStore.get(key);
  } finally {
    release();
  }
}

export const unsetValue = async (key: string): Promise<void> => {
  const release = await mutex.acquire();
  try {
    memoryStore.delete(key);
  } finally {
    release();
  }
}