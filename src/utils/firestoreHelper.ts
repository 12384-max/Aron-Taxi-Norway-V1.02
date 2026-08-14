/**
 * Utility helper to recursively remove all undefined properties from objects
 * before sending to Firebase Firestore, preventing runtime FirebaseError: Unsupported field value: undefined
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj.map((item) => removeUndefinedFields(item)) as unknown as T;
  }

  const clean: Record<string, any> = {};
  for (const [key, value] of Object.entries(obj as Record<string, any>)) {
    if (value !== undefined) {
      if (value !== null && typeof value === 'object' && !(value instanceof Date)) {
        clean[key] = removeUndefinedFields(value);
      } else {
        clean[key] = value;
      }
    }
  }
  return clean as T;
}
