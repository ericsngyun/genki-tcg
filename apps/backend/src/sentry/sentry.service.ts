import { Injectable, Logger } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

@Injectable()
export class SentryService {
  private readonly logger = new Logger(SentryService.name);

  captureException(exception: any, context?: string) {
    this.logger.error(`Exception in ${context || 'unknown context'}:`, exception);

    Sentry.captureException(exception, {
      tags: {
        context: context || 'unknown',
      },
    });
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    Sentry.captureMessage(message, level);
  }
}
