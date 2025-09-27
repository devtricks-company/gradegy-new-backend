import { registerAs } from '@nestjs/config';

export default registerAs('swagger', () => ({
  enabled: (process.env.SWAGGER_ENABLED ?? 'true').toLowerCase() !== 'false',
  path: process.env.SWAGGER_PATH ?? 'docs',
  title: process.env.SWAGGER_TITLE ?? 'Gradegy API',
  description:
    process.env.SWAGGER_DESCRIPTION ?? 'Interactive documentation for the Gradegy API',
  version: process.env.SWAGGER_VERSION ?? '1.0',
}));
