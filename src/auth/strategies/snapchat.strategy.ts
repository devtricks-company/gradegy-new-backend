import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy } from 'passport-snapchat';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

interface SnapchatProfile {
  id: string;
  displayName?: string;
  emails?: Array<{ value: string }>;
  name?: { givenName?: string; familyName?: string };
  photos?: Array<{ value: string }>;
  _json?: {
    data?: {
      bitmoji?: { avatar?: string };
      displayName?: string;
    };
  };
}

@Injectable()
export class SnapchatStrategy extends PassportStrategy(Strategy, 'snapchat') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('auth.snapchat.clientId', ''),
      clientSecret: configService.get<string>('auth.snapchat.clientSecret', ''),
      callbackURL: configService.get<string>('auth.snapchat.callbackURL', ''),
      scope: configService.get<string[]>('auth.snapchat.scope', [
        'user.display_name',
        'user.bitmoji.avatar',
        'user.external_id',
      ]),
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: SnapchatProfile,
  ): Promise<AuthenticatedUser> {
    const email = profile.emails?.[0]?.value;
    const displayName = profile.displayName ?? profile._json?.data?.displayName;
    const displayParts = displayName?.trim().split(' ').filter(Boolean) ?? [];

    const firstName =
      profile.name?.givenName ?? displayParts[0] ?? undefined;
    const lastName =
      profile.name?.familyName ??
      (displayParts.length > 1 ? displayParts.slice(1).join(' ') : undefined);
    const avatarUrl =
      profile.photos?.[0]?.value ?? profile._json?.data?.bitmoji?.avatar;

    return this.authService.validateOAuthUser('snapchat', {
      providerId: profile.id,
      email,
      firstName,
      lastName,
      avatarUrl,
    });
  }
}
