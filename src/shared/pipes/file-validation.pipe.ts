import {
  type ArgumentMetadata,
  BadRequestException,
  Injectable,
  type PipeTransform,
} from '@nestjs/common';
import { validateFileFormat, validateFileSize } from '../utils/file.util';

@Injectable()
export class FileValidationType implements PipeTransform {
  transform(value: any, metadata: ArgumentMetadata) {
    if (!value.filename) {
      throw new BadRequestException('Файл не загружен');
    }

    const { filename, createReadStream } = value;

    const fileStream = createReadStream();

    const allowedFormats = ['jpg', 'jpeg', 'png', 'wepb', 'gif'];
    const isFileformatValid = validateFileFormat(filename, allowedFormats);

    if (!isFileformatValid) {
      throw new BadRequestException('Неподдерживаемый формат файла');
    }

    const isFileSizeValid = validateFileSize(fileStream, 10 * 1024 * 1024);

    if (!isFileSizeValid) {
      throw new BadRequestException('Размер файла привешает 10 МБ');
    }

    return value;
  }
}
