export class ArrayList {
  constructor(private array: any[]) {}

  get(index: number) {
    return this.array[index];
  }
}
