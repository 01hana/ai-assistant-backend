import { Type } from 'class-transformer';
import { ArrayMaxSize, IsArray, IsObject, IsOptional, IsString, Matches, MaxLength, ValidateNested } from 'class-validator';

class PageContextSelectedRowDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  id?: string;

  @IsOptional()
  @IsObject()
  data?: Record<string, unknown>;
}

export class PageContextDto {
  @IsOptional()
  @IsString()
  @MaxLength(256)
  module?: string;

  @IsOptional()
  @IsString()
  @MaxLength(512)
  route?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  screenId?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  entityType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(256)
  entityId?: string;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => PageContextSelectedRowDto)
  selectedRows?: PageContextSelectedRowDto[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(32)
  activeFilters?: unknown[];

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(64)
  @IsString({ each: true })
  @MaxLength(256, { each: true })
  visibleColumns?: string[];

  @IsOptional()
  @IsObject()
  userVisibleState?: Record<string, unknown>;

  @IsOptional()
  @IsString()
  @MaxLength(132)
  @Matches(/^ccr_[A-Za-z0-9_-]{1,128}$/)
  connectorContextRef?: string;
}
