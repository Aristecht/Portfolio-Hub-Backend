import { Injectable, NestMiddleware } from '@nestjs/common';
import type { NextFunction, Request, Response } from 'express';
import * as bodyParser from 'body-parser';

@Injectable()
export class RawBodymiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    bodyParser.raw({ type: 'application/json' })(req, res, next);
  }
}
