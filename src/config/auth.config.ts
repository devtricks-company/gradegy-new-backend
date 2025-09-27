import { registerAs } from '@nestjs/config';

export interface AuthConfig {
  jwt: {
    secret: string;
    expiresIn: string | number;
    refreshSecret: string;
    refreshExpiresIn: string | number;
  };
  google: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
  };
  snapchat: {
    clientId: string;
    clientSecret: string;
    callbackURL: string;
    scope: string[];
  };
}

const defaultSnapchatScope = [
  'user.display_name',
  'user.bitmoji.avatar',
  'user.external_id',
];

export default registerAs('auth', (): AuthConfig => ({
  jwt: {
    secret: process.env.JWT_SECRET ?? 'change-me',
    expiresIn: process.env.JWT_EXPIRES_IN ?? '1h',
    refreshSecret: process.env.JWT_REFRESH_SECRET ?? 'change-me-too',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN ?? '7d',
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID ?? '',
    clientSecret: process.env.GOOGLE_CLIENT_SECRET ?? '',
    callbackURL:
      process.env.GOOGLE_CALLBACK_URL ?? 'http://localhost:5400/auth/google/callback',
  },
  snapchat: {
    clientId: process.env.SNAPCHAT_CLIENT_ID ?? '',
    clientSecret: process.env.SNAPCHAT_CLIENT_SECRET ?? '',
    callbackURL:
      process.env.SNAPCHAT_CALLBACK_URL ?? 'http://localhost:5400/auth/snapchat/callback',
    scope: (process.env.SNAPCHAT_SCOPE?.split(',').map((scope) => scope.trim()) ?? defaultSnapchatScope).filter(Boolean),
  },
}));
