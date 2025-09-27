import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PassportStrategy } from '@nestjs/passport';
import { Profile, Strategy } from 'passport-google-oauth20';
import { AuthService } from '../auth.service';
import { AuthenticatedUser } from '../interfaces/authenticated-user.interface';

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor(
    configService: ConfigService,
    private readonly authService: AuthService,
  ) {
    super({
      clientID: configService.get<string>('auth.google.clientId', ''),
      clientSecret: configService.get<string>('auth.google.clientSecret', ''),
      callbackURL: configService.get<string>('auth.google.callbackURL', ''),
      scope: ['profile', 'email'],
    });
  }

  async validate(
    accessToken: string,
    refreshToken: string,
    profile: Profile,
  ): Promise<AuthenticatedUser> {
    const email = profile.emails?.[0]?.value;
    const firstName = profile.name?.givenName;
    const lastName = profile.name?.familyName;
    const avatarUrl = profile.photos?.[0]?.value;

    return this.authService.validateOAuthUser('google', {
      providerId: profile.id,
      email,
      firstName,
      lastName,
      avatarUrl,
    });
  }
}
