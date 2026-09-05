import {
  Controller,
  Get,
  Param,
  Post,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { FilesService } from './files.service';

type AuthenticatedRequest = Request & {
  user: {
    id: number;
    organization_id: number;
  };
};

@Controller('files')
@UseGuards(JwtAuthGuard)
export class FilesController {
  constructor(private readonly filesService: FilesService) {}

  @Post('upload')
  @UseInterceptors(FileInterceptor('file'))
  upload(
    @UploadedFile()
    file: Express.Multer.File,

    @Req()
    req: AuthenticatedRequest,
  ) {
    return this.filesService.upload(
      file,
      req.user.id,
      req.user.organization_id,
    );
  }

  @Get(':id')
  getFile(
    @Param('id')
    id: string,
  ) {
    return this.filesService.findOne(Number(id));
  }
}
