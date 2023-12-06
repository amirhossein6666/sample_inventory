import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  UseInterceptors,
  UploadedFile,
  UseGuards,
} from '@nestjs/common';
import { ArangoNewOldResult, ResultList } from 'nest-arango';
import { ApiBody, ApiConsumes, ApiOperation } from '@nestjs/swagger';
import { CategoryService } from '../../services/category/category.service';
import { CategoryEntity } from '../../entities/category/category.entity';
import { FileInterceptor } from '@nestjs/platform-express';
import { v4 as uuidv4 } from 'uuid';
import * as fs from 'fs/promises';
import * as path from 'path';
import { AuthGuard } from '../../auth/auth.guard';
@Controller('Category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}
  @Post()
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    schema: {
      type: 'object',
      properties: {
        categoryName: {
          type: 'string',
        },
        parentId: {
          type: 'integer',
        },
        description: {
          type: 'string',
        },
        image: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  async createCategory(
    @UploadedFile() image: Express.Multer.File,
    @Body() category: CategoryEntity,
  ) {
    category.imageId = uuidv4();
    const folderPath: string = './images/';
    const imageBuffer = image.buffer;
    const imagePath = path.join(folderPath, `${category.imageId}.jpg`);
    await fs.writeFile(imagePath, imageBuffer);
    return await this.categoryService.create(category);
  }
  @UseGuards(AuthGuard)
  @Get()
  @ApiOperation({
    summary: 'دریافت تمام محصولات',
  })
  async findAll(): Promise<ResultList<CategoryEntity>> {
    return await this.categoryService.findAll();
  }
  @Get(':categoryName')
  @ApiOperation({
    summary: 'دریافت دسته بندی با نام ',
  })
  async findOne(
    @Param('categoryName') categoryName: string,
  ): Promise<CategoryEntity | null> {
    return await this.categoryService.findOne(categoryName);
  }

  @Put(':categoryName')
  @ApiOperation({
    summary: 'ویرایش دسته بندی',
    requestBody: { description: 'string', content: null, required: true },
  })
  async update(
    @Param('categoryName') categoryName: string,
    @Body() Category: CategoryEntity,
  ): Promise<ArangoNewOldResult<any>> {
    return await this.categoryService.update(categoryName, Category);
  }

  @Delete(':categoryName')
  @ApiOperation({
    summary: 'حذف دسته بندی',
  })
  async remove(@Param('categoryName') categoryName: string): Promise<void> {
    return await this.categoryService.remove(categoryName);
  }
}
