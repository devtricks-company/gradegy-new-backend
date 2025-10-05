import {
  BlobServiceClient,
  BlockBlobClient,
  ContainerClient,
} from '@azure/storage-blob';
import { HttpException, HttpStatus, Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';

export interface UploadResult {
  url: string;
  blobName: string;
  containerName: string;
}

@Injectable()
export class AzurestorageService {
  private blobServiceClient: BlobServiceClient;
  private containerName: string;
  constructor(private configService: ConfigService) {
    const connectionString = this.configService.get<string>(
      'azurestorage.connectionString',
    );
    this.containerName =
      this.configService.get<string>('azurestorage.storageName') || 'images';

    if (!connectionString) {
      throw new Error(`Azure storage connection string not found`);
    }

    this.blobServiceClient =
      BlobServiceClient.fromConnectionString(connectionString);
  }

  private getContainerClient(): ContainerClient {
    return this.blobServiceClient.getContainerClient(this.containerName);
  }

  async uploadFile(
    file: Express.Multer.File,
    folder?: string,
  ): Promise<UploadResult> {
    try {
      // Generate unique file name
      const fileExtension = file.originalname.split('.').pop();
      const fileName = `${uuidv4()}.${fileExtension}`;
      const blobName = folder;

      //get container client
      const containerClient = this.getContainerClient();

      // Ensure container exist
      await containerClient.createIfNotExists({
        access: 'container',
      });

      //get Blob client
      const blockBlobClient: BlockBlobClient =
        containerClient.getBlockBlobClient(blobName || fileName);

      // set content type baseed on file
      const contentType = this.getContentType(file.mimetype);

      //upload file
      await blockBlobClient.upload(file.buffer, file.size, {
        blobHTTPHeaders: {
          blobContentType: contentType,
        },
      });

      //return result
      return {
        url: blockBlobClient.url,
        blobName: blobName || fileName,
        containerName: this.containerName,
      };
    } catch (error) {
      throw new HttpException(
        `Failed to upload file: ${error.message}`,
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getFileUrl(blobName: string): Promise<string> {
    const containerClient = this.getContainerClient();
    const blockBlobClient = containerClient.getBlockBlobClient(blobName);
    return blockBlobClient.url;
  }

  private getContentType(mimetype: string): string {
    const contentTypeMap: { [key: string]: string } = {
      'image/jpeg': 'image/jpeg',
      'image/png': 'image/png',
      'image/gif': 'image/gif',
      'image/webp': 'image/webp',
      'image/svg+xml': 'image/svg+xml',
    };

    return contentTypeMap[mimetype] || 'application/octet-stream';
  }

  // Method to check if file is an image
  isImageFile(file: Express.Multer.File): boolean {
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/svg+xml',
    ];
    return allowedMimeTypes.includes(file.mimetype);
  }
}
