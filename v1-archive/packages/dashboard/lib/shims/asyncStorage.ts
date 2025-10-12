type Value = string | null

const asyncStorageShim = {
  getItem: async (_key: string): Promise<Value> => null,
  setItem: async (_key: string, _value: string): Promise<void> => {},
  removeItem: async (_key: string): Promise<void> => {},
  clear: async (): Promise<void> => {},
  getAllKeys: async (): Promise<string[]> => [],
  multiGet: async (keys: readonly string[]): Promise<[string, Value][]> =>
    keys.map((key) => [key, null]),
  multiSet: async (_entries: readonly [string, string][]): Promise<void> => {},
  multiRemove: async (_keys: readonly string[]): Promise<void> => {},
}

export default asyncStorageShim
export const AsyncStorage = asyncStorageShim
