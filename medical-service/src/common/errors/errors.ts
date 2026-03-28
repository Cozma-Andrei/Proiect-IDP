export class ResourceConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceConflictError";
  }
}

export class ResourceNotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceNotFoundError";
  }
}

export class ResourceInvalidError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ResourceInvalidError";
  }
}
  