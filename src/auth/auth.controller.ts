import { Body, Controller, Get, Post, UseGuards } from '@nestjs/common';
import {
  ApiBody,
  ApiOkResponse,
  ApiOperation,
  ApiTags,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { LoginDto } from './dto/login.dto';
import { RefreshTokenDto } from './dto/refresh-token.dto';
import { RegisterLocalDto } from './dto/register-local.dto';
import { GoogleAuthGuard } from './guards/google-auth.guard';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { LocalAuthGuard } from './guards/local-auth.guard';
import { SnapchatAuthGuard } from './guards/snapchat-auth.guard';
import type { AuthenticatedUser } from './interfaces/authenticated-user.interface';
import type { AuthResponse } from './interfaces/auth-response.interface';

@ApiTags('auth')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @ApiOperation({ summary: 'Register a new user using email and password.' })
  @ApiOkResponse({ description: 'User registered and authenticated successfully.' })
  register(@Body() dto: RegisterLocalDto): Promise<AuthResponse> {
    return this.authService.registerLocal(dto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @ApiOperation({ summary: 'Authenticate user credentials and issue JWT tokens.' })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({ description: 'Tokens issued successfully.' })
  login(@CurrentUser() user: AuthenticatedUser): Promise<AuthResponse> {
    return this.authService.login(user);
  }

  @Public()
  @Post('refresh')
  @ApiOperation({ summary: 'Exchange a refresh token for new JWT tokens.' })
  @ApiOkResponse({ description: 'New tokens issued successfully.' })
  refresh(@Body() dto: RefreshTokenDto): Promise<AuthResponse> {
    return this.authService.refreshTokens(dto.refreshToken);
  }

  @UseGuards(JwtAuthGuard)
  @Get('me')
  @ApiOperation({ summary: 'Return the authenticated user profile.' })
  @ApiOkResponse({ description: 'Authenticated user payload returned.' })
  me(@CurrentUser() user: AuthenticatedUser): AuthenticatedUser {
    return user;
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @ApiOperation({ summary: 'Invalidate the active refresh token.' })
  @ApiOkResponse({ description: 'Refresh token revoked.' })
  logout(@CurrentUser() user: AuthenticatedUser): Promise<void> {
    return this.authService.logout(user.id);
  }

  @Public()
  @Get('google')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Initiate Google OAuth2 login flow.' })
  googleAuth(): void {
    // Guard redirects to Google
  }

  @Public()
  @Get('google/callback')
  @UseGuards(GoogleAuthGuard)
  @ApiOperation({ summary: 'Google OAuth2 callback handler.' })
  @ApiOkResponse({ description: 'Tokens issued via Google OAuth flow.' })
  googleCallback(@CurrentUser() user: AuthenticatedUser): Promise<AuthResponse> {
    return this.authService.login(user);
  }

  @Public()
  @Get('snapchat')
  @UseGuards(SnapchatAuthGuard)
  @ApiOperation({ summary: 'Initiate Snapchat OAuth2 login flow.' })
  snapchatAuth(): void {
    // Guard redirects to Snapchat
  }

  @Public()
  @Get('snapchat/callback')
  @UseGuards(SnapchatAuthGuard)
  @ApiOperation({ summary: 'Snapchat OAuth2 callback handler.' })
  @ApiOkResponse({ description: 'Tokens issued via Snapchat OAuth flow.' })
  snapchatCallback(@CurrentUser() user: AuthenticatedUser): Promise<AuthResponse> {
    return this.authService.login(user);
  }
}
