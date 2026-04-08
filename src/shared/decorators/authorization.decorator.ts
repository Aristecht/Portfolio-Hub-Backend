import { applyDecorators, UseGuards } from '@nestjs/common';

import { Role } from '../../../prisma/generated/prisma/enums';
import { GqlAuthGuard } from '../guards/gql-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from './roles.decorator';

export function Authorization(...roles: Role[]) {
  if (roles.length > 0) {
    return applyDecorators(
      Roles(...roles),
      UseGuards(GqlAuthGuard, RolesGuard),
    );
  }

  return applyDecorators(UseGuards(GqlAuthGuard));
}
