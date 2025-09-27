declare module 'passport-snapchat' {
  import type { Request } from 'express';

  export interface SnapchatStrategyOptions {
    clientID: string;
    clientSecret: string;
    callbackURL: string;
    scope?: string[];
    profileFields?: string[];
    passReqToCallback?: boolean;
  }

  export interface SnapchatProfile {
    id: string;
    displayName?: string;
    emails?: Array<{ value: string }>;
    name?: { givenName?: string; familyName?: string };
    photos?: Array<{ value: string }>;
    _json?: Record<string, unknown>;
  }

  export type VerifyCallback = (
    error: any,
    user?: any,
    info?: any,
  ) => void;

  export type SnapchatVerifyFunction = (
    accessToken: string,
    refreshToken: string,
    profile: SnapchatProfile,
    done: VerifyCallback,
  ) => void | Promise<void>;

  export type SnapchatVerifyFunctionWithRequest = (
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: SnapchatProfile,
    done: VerifyCallback,
  ) => void | Promise<void>;

  export class Strategy {
    constructor(
      options: SnapchatStrategyOptions,
      verify: SnapchatVerifyFunction,
    );
    constructor(
      options: SnapchatStrategyOptions & { passReqToCallback: true },
      verify: SnapchatVerifyFunctionWithRequest,
    );
    name: string;
    authenticate(req: Request, options?: any): void;
  }
}
