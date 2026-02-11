export class HandleError extends Error {
  constructor(message: string, public statusCode: number) {
    super(message);
  }
}
