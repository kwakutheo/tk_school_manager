import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, ValidateNested } from 'class-validator';
import { RecordExamResultDto } from './record-exam-result.dto';

export class RecordExamResultsDto {
  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => RecordExamResultDto)
  results!: RecordExamResultDto[];
}
