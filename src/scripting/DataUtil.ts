
export class DataUtil {

  createDoubleArray(size: number) {
    return Array(size).fill(0);
  }

  createIntArray(size: number) {
    return Array(size).fill(0);
  }

  toJavaDoubleArray(arr: number[]) {
    return [...arr];
  }

  toJavaIntArray(arr: number[]) {
    return [...arr];
  }
}
