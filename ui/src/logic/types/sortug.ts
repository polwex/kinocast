export type BResult<Success, Error> = { ok: Success } | { error: Error };

export type Result<Success> = { ok: Success } | { error: string };

export type AResult<Success> = Promise<Result<Success>>;
