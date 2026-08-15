/**
 * Utility helper to recursively remove all undefined properties from objects
 * and flatten/sanitize nested arrays before sending to Firebase Firestore,
 * preventing runtime errors:
 * 1. "Unsupported field value: undefined"
 * 2. "Nested arrays are not supported" (e.g. routeGeometry [[lat, lng], ...])
 */
export function removeUndefinedFields<T>(obj: T): T {
  if (obj === null || obj === undefined || typeof obj !== 'object') {
    return obj;
  }

  if (Array.isArray(obj)) {
    return obj
      .filter((item) => item !== undefined)
      .map((item) => {
        if (Array.isArray(item)) {
          // Firestore does not support nested arrays (e.g. [ [lat, lng], ... ]).
          // If it's a coordinate pair [number, number], convert to a map object { lat, lng }.
          if (item.length === 2 && typeof item[0] === 'number' && typeof item[1] === 'number') {
            return { lat: item[0], lng: item[1] };
          }
          // If it's any other nested array, convert to an indexed map object
          const nestedMap: Record<string, any> = {};
          item.forEach((val, idx) => {
            if (val !== undefined) {
              nestedMap[`_${idx}`] = removeUndefinedFields(val);
            }
          });
          return nestedMap;
        }
        return removeUndefinedFields(item);
      }) as unknown as T;
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

