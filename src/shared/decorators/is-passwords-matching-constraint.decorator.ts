import {
  ValidatorConstraint,
  type ValidationArguments,
  type ValidatorConstraintInterface,
} from 'class-validator';

import { NewPasswordInput } from '../../modules/auth/password-recovery/inputs/new-password.input';

@ValidatorConstraint({ name: 'IsPasswordMatching', async: false })
export class IsPasswordMatchingConstraint implements ValidatorConstraintInterface {
  validate(passwordRepeat: string, args: ValidationArguments) {
    const object = args.object as NewPasswordInput;

    return object.password === passwordRepeat;
  }
  defaultMessage(validationArguments?: ValidationArguments) {
    return 'Пароли не совпадают';
  }
}
