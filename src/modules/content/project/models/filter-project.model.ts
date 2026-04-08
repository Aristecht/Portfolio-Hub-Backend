import { Field, ObjectType } from '@nestjs/graphql';

import { ProjectModel } from './project.model';
import { ProjectMetaModel } from './meta.model';

@ObjectType()
export class FilterProjectModel {
  @Field(() => [ProjectModel])
  data: ProjectModel[];

  @Field(() => ProjectMetaModel)
  meta: ProjectMetaModel;
}
