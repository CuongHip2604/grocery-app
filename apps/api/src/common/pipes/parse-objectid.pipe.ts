import { PipeTransform, Injectable, BadRequestException } from '@nestjs/common';

@Injectable()
export class ParseObjectIdPipe implements PipeTransform<string, string> {
  transform(value: string): string {
    // MongoDB ObjectId is a 24 character hex string
    const objectIdRegex = /^[a-fA-F0-9]{24}$/;
    if (!objectIdRegex.test(value)) {
      throw new BadRequestException('Invalid ID format');
    }
    return value;
  }
}
