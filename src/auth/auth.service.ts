import {
  ConflictException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { compare, hash } from 'bcryptjs';
import { UsersService, OAuthUserInput, OAuthProvider } from '../users/users.service';
import { RegisterLocalDto } from './dto/register-local.dto';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { AuthResponse, AuthTokens } from './interfaces/auth-response.interface';
import { JwtPayload } from './interfaces/jwt-payload.interface';
import { UserDocument } from '../users/schemas/user.schema';

const BCRYPT_SALT_ROUNDS = 12;
const DEFAULT_REFRESH_TTL_MS = 7 * 24 * 60 * 60 * 1000;

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  async registerLocal(dto: RegisterLocalDto): Promise<AuthResponse> {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser?.password) {
      throw new ConflictException('Email is already registered.');
    }

    const hashedPassword = await hash(dto.password, BCRYPT_SALT_ROUNDS);
    let userDocument: UserDocument;

    if (existingUser) {
      existingUser.password = hashedPassword;
      existingUser.firstName = dto.firstName ?? existingUser.firstName;
      existingUser.lastName = dto.lastName ?? existingUser.lastName;
      existingUser.avatarUrl = dto.avatarUrl ?? existingUser.avatarUrl;
      userDocument = await existingUser.save();
    } else {
      userDocument = await this.usersService.create({
        email: dto.email,
        password: hashedPassword,
        firstName: dto.firstName,
        lastName: dto.lastName,
        avatarUrl: dto.avatarUrl,
      });
    }

    await this.usersService.recordLogin(userDocument.id);
    return this.buildAuthResponse(this.mapUser(userDocument));
  }

  async validateLocalUser(email: string, password: string): Promise<AuthenticatedUser> {
    const user = await this.usersService.findByEmail(email);

    if (!user || !user.password) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    const isMatching = await compare(password, user.password);

    if (!isMatching) {
      throw new UnauthorizedException('Invalid credentials.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive.');
    }

    await this.usersService.recordLogin(user.id);
    return this.mapUser(user);
  }

  async validateOAuthUser(
    provider: OAuthProvider,
    profile: Omit<OAuthUserInput, 'provider'>,
  ): Promise<AuthenticatedUser> {
    const user = await this.usersService.upsertOAuthUser({
      provider,
      ...profile,
    });

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive.');
    }

    await this.usersService.recordLogin(user.id);
    return this.mapUser(user);
  }

  async login(user: AuthenticatedUser): Promise<AuthResponse> {
    return this.buildAuthResponse(user);
  }

  async refreshTokens(refreshToken: string): Promise<AuthResponse> {
    const refreshSecret = this.configService.get<string>(
      'auth.jwt.refreshSecret',
      'change-me-too',
    );

    let payload: JwtPayload;

    try {
      payload = await this.jwtService.verifyAsync<JwtPayload>(refreshToken, {
        secret: refreshSecret,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    const user = await this.usersService.findOne(payload.sub);

    if (!user.refreshTokenHash) {
      throw new UnauthorizedException('Refresh token not found.');
    }

    const isValid = await compare(refreshToken, user.refreshTokenHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token.');
    }

    if (user.refreshTokenExpiresAt && user.refreshTokenExpiresAt.getTime() < Date.now()) {
      throw new UnauthorizedException('Refresh token expired.');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is inactive.');
    }

    return this.buildAuthResponse(this.mapUser(user));
  }

  async logout(userId: string): Promise<void> {
    await this.usersService.clearRefreshToken(userId);
  }

  private async buildAuthResponse(user: AuthenticatedUser): Promise<AuthResponse> {
    const tokens = await this.issueTokens(user);
    return { user, tokens };
  }

  private async issueTokens(user: AuthenticatedUser): Promise<AuthTokens> {
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      role: user.role,
    };

    const accessTokenExpiresIn = this.configService.get<string | number>(
      'auth.jwt.expiresIn',
      '1h',
    );
    const accessTokenSecret = this.configService.get<string>('auth.jwt.secret', 'change-me');
    const refreshTokenExpiresIn = this.configService.get<string | number>(
      'auth.jwt.refreshExpiresIn',
      '7d',
    );
    const refreshTokenSecret = this.configService.get<string>(
      'auth.jwt.refreshSecret',
      'change-me-too',
    );

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: accessTokenSecret,
        expiresIn: accessTokenExpiresIn,
      }),
      this.jwtService.signAsync(payload, {
        secret: refreshTokenSecret,
        expiresIn: refreshTokenExpiresIn,
      }),
    ]);

    await this.persistRefreshToken(user.id, refreshToken, refreshTokenExpiresIn);

    return {
      accessToken,
      accessTokenExpiresIn,
      refreshToken,
      refreshTokenExpiresIn,
    };
  }

  private async persistRefreshToken(
    userId: string,
    refreshToken: string,
    refreshTokenExpiresIn: string | number,
  ): Promise<void> {
    const refreshTokenHash = await hash(refreshToken, BCRYPT_SALT_ROUNDS);
    const expiresAt =
      this.extractExpiration(refreshToken) ??
      new Date(Date.now() + this.resolveExpiresInMs(refreshTokenExpiresIn));

    await this.usersService.updateRefreshToken(userId, refreshTokenHash, expiresAt);
  }

  private extractExpiration(token: string): Date | undefined {
    const decoded = this.jwtService.decode(token) as { exp?: number } | null;

    if (!decoded?.exp) {
      return undefined;
    }

    return new Date(decoded.exp * 1000);
  }

  private resolveExpiresInMs(expiresIn: string | number): number {
    if (typeof expiresIn === 'number') {
      return expiresIn * 1000;
    }

    const match = /^(\d+)([smhdw])$/.exec(expiresIn.trim());

    if (!match) {
      return DEFAULT_REFRESH_TTL_MS;
    }

    const value = Number(match[1]);
    const unit = match[2];

    const unitMap: Record<string, number> = {
      s: 1000,
      m: 60 * 1000,
      h: 60 * 60 * 1000,
      d: 24 * 60 * 60 * 1000,
      w: 7 * 24 * 60 * 60 * 1000,
    };

    const multiplier = unitMap[unit];
    if (!multiplier) {
      return DEFAULT_REFRESH_TTL_MS;
    }

    return value * multiplier;
  }

  private mapUser(user: UserDocument): AuthenticatedUser {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      avatarUrl: user.avatarUrl,
      role: user.role,
      isActive: user.isActive,
    };
  }
}
