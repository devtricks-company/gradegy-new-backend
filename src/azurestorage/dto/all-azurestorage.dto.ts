import { ApiProperty } from "@nestjs/swagger";

export class UploadResultDto{
  @ApiProperty({
    description: 'The URL of the uploaded file',
    example:
      'https://mystorageaccount.blob.core.windows.net/images/my-image-123.jpg',
  })
  url: string;


   @ApiProperty({
    description: 'The blob name in Azure Storage',
    example: 'images/my-image-123.jpg',
  })
  blobName: string;


    @ApiProperty({
    description: 'The original filename',
    example: 'my-image.jpg',
  })
  fileName: string;

   @ApiProperty({
    description: 'The file size in bytes',
    example: 1024576,
  })
  size: number;

    @ApiProperty({
    description: 'The MIME type of the file',
    example: 'image/jpeg',
  })
  mimeType: string;
}


export class DeleteResponseDto{
     @ApiProperty({
    description: 'Success message',
    example: 'File deleted successfully',
  })
  message: string;
}

export class UrlResponseDto{
    @ApiProperty({
    description: 'The URL of the requested file',
    example:
      'https://mystorageaccount.blob.core.windows.net/images/my-image-123.jpg',
  })
  url: string;
}

export class ListFilesResponseDto {
  @ApiProperty({
    description: 'Array of file names',
    type: [String],
    example: ['images/photo1.jpg', 'images/photo2.png', 'documents/file.pdf'],
  })
  files: string[];
}

export class ErrorResponseDto {
  @ApiProperty({
    description: 'HTTP status code',
    example: 400,
  })
  statusCode: number;

  @ApiProperty({
    description: 'Error message',
    example: 'Only image files are allowed!',
  })
  message: string;

  @ApiProperty({
    description: 'Error type',
    example: 'Bad Request',
  })
  error: string;
}

export class FileUploadDto {
  @ApiProperty({
    type: 'string',
    format: 'binary',
    description: 'Image file to upload (JPG, JPEG, PNG, GIF, WEBP)',
  })
  file: any;
}


export class MultipleFileUploadDto {
  @ApiProperty({
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    description: 'Multiple image files to upload (max 10 files)',
  })
  files: any[];
}