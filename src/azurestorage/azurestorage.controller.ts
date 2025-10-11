import {
  BadRequestException,
  Controller,
  Get,
  Param,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { AzurestorageService, UploadResult } from './azurestorage.service';
import { FileInterceptor } from '@nestjs/platform-express';
import {
  ApiOperation,
  ApiConsumes,
  ApiBody,
  ApiQuery,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import {
  FileUploadDto,
  UploadResultDto,
  ErrorResponseDto,
  UrlResponseDto,
} from './dto/all-azurestorage.dto';

@Controller('azurestorage')
export class AzurestorageController {
  constructor(private readonly azurestorageService: AzurestorageService) {}

  @Post('image')
  @UseInterceptors(
    FileInterceptor('file', {
      limits: {
        fileSize: 10 * 1024 * 1024,
      },
      fileFilter: (req, file, callback) => {
        console.log(file);
        if (!file.mimetype.match(/\/(jpg|jpeg|png|gif|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed!'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  @ApiOperation({
    summary: 'Upload a single image',
    description:
      'Upload a single image file to Azure Storage. Supported formats: JPG, JPEG, PNG, GIF, WEBP. Maximum file size: 5MB.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Image file to upload',
    type: FileUploadDto,
  })
  @ApiQuery({
    name: 'folder',
    required: false,
    description: 'Optional folder path to organize files',
    type: String,
    example: 'images/profile',
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UploadResultDto,
  })
  @ApiResponse({
    status: 400,
    description:
      'Bad request - No file uploaded, invalid file type, or file too large',
    type: ErrorResponseDto,
  })
  async uploadImage(
    @UploadedFile() file: Express.Multer.File,
    @Query('folder') folder?: string,
  ): Promise<UploadResult> {
    console.log('start');
    if (!file) {
      throw new BadRequestException('No file uploaded');
    }

    if (!this.azurestorageService.isImageFile(file)) {
      throw new BadRequestException('File must be an image');
    }

    return this.azurestorageService.uploadFile(file, folder);
  }

  @Get('url/:blobName')
  @ApiOperation({
    summary: 'Get image URL',
    description: 'Get the public URL for an image file stored in Azure Storage',
  })
  @ApiParam({
    name: 'blobName',
    description: 'The blob name of the file',
    type: String,
    example: 'images/my-image-123.jpg',
  })
  @ApiResponse({
    status: 200,
    description: 'URL retrieved successfully',
    type: UrlResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'File not found',
    type: ErrorResponseDto,
  })
  async getImageUrl(
    @Param('blobName') blobName: string,
  ): Promise<{ url: string }> {
    const url = await this.azurestorageService.getFileUrl(blobName);
    return { url };
  }
}
