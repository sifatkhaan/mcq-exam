import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { randomUUID } from 'crypto';
import { mkdir, writeFile } from 'fs/promises';
import { join } from 'path';
import { FileEntity } from './entities/file.entity';
@Injectable()
export class FilesService {
  constructor(
    @InjectRepository(FileEntity)
    private readonly fileRepository: Repository<FileEntity>,
  ) {}

  // ==========================================
  // UPLOAD FILE
  // ==========================================

  async upload(
    file: Express.Multer.File,
    userId: number,
    organizationId: number | null,
  ) {
    if (!file) {
      throw new Error('File is required');
    }

    const extension = file.originalname.includes('.')
      ? file.originalname.substring(file.originalname.lastIndexOf('.'))
      : '';

    const storedFileName = `${randomUUID()}${extension}`;
    const uploadDirectory = join(process.cwd(), 'uploads');

    await mkdir(uploadDirectory, {
      recursive: true,
    });

    const absoluteFilePath = join(uploadDirectory, storedFileName);

    await writeFile(absoluteFilePath, file.buffer);

    const relativeFilePath = `uploads/${storedFileName}`;

    const fileEntity = this.fileRepository.create({
      organization_id: organizationId,
      user_id: userId,
      file_name: storedFileName,
      original_name: file.originalname,
      file_url: relativeFilePath,
      mime_type: file.mimetype,
      size_bytes: file.size,
      storage_provider: 'LOCAL',
    });

    return this.fileRepository.save(fileEntity);
  }

  // ==========================================
  // GET FILE INFORMATION
  // ==========================================

  async findOne(id: number) {
    const file = await this.fileRepository.findOne({
      where: {
        id,
      },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }
}
