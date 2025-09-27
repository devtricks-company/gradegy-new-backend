import { ExecutionContext, Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class GoogleAuthGuard extends AuthGuard('google') {
  getAuthenticateOptions(context: ExecutionContext) {
    const options = super.getAuthenticateOptions(context);
    return {
      ...(options ?? {}),
      scope: ['profile', 'email'],
      prompt: 'select_account',
    };
  }
}
