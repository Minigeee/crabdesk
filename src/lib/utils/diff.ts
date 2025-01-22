/**
 * Return the difference in fields between an original object and a new object.
 * This function checks objects recursively, and returns a nested object of differences.
 * If a field has been removed in the new object, it will be represented as `null` in
 * the diff object. If a field is an array, then the entire new array will be returned
 * in the diff object if even a single object is different, or if the array lengths are different.
 *
 * @param origObj The original object
 * @param newObj The new object to compare to the original
 * @returns A diff object
 */
export function diff<B>(origObj: any, newObj: B): Partial<B> | undefined {
  if (origObj == null && newObj != null) {
    // new is diff + non-null
    return newObj;
  } else if (origObj != null && newObj == null) {
    // new is diff + null
    return null as B;
  } else if (origObj == null && newObj == null) {
    // Same
    return undefined;
  } else if (typeof origObj !== typeof newObj) {
    // new is diff
    return newObj;
  } else {
    if (newObj === origObj) return undefined;
    else if (Array.isArray(origObj) && Array.isArray(newObj)) {
      // Return entire array if it is diff
      if (
        origObj.length !== newObj.length ||
        origObj.findIndex((x, i) => x !== newObj[i]) >= 0
      )
        return newObj;
    } else if (typeof origObj === 'object') {
      // Set of keys
      const keys = new Set<string>(
        Object.keys(origObj).concat(Object.keys(newObj as object)),
      );

      const obj: any = {};
      for (const k of Array.from(keys)) {
        const propDiff = diff(origObj[k], newObj[k as keyof B]);
        if (propDiff !== undefined) obj[k] = propDiff;
      }

      return Object.keys(obj).length > 0 ? obj : undefined;
    } else if (newObj !== origObj) return newObj;
    else return undefined;
  }

  return undefined;
}
