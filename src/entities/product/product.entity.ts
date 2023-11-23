import { Collection, ArangoDocument, BeforeSave } from 'nest-arango';
import { ApiProperty } from '@nestjs/swagger';

@Collection('Products')
export class ProductEntity extends ArangoDocument {
  @ApiProperty({ description: 'product id', example: '1' })
  id?: number;
  @ApiProperty({ description: 'name', example: 'موز' })
  productName?: string;
  @ApiProperty({ description: 'price', example: '1000' })
  price?: number;
  @ApiProperty({
    description: 'شناسه دسته بندی های میوه',
    example: '1',
  })
  categoriesId?: number[];
  @ApiProperty({
    description: 'product description',
    example: 'موز به انبار اضافه شد',
  })
  description?: string;
  created_at?: Date;
  updated_at?: Date;

  @BeforeSave()
  beforeSave() {
    this.created_at = new Date();
    this.updated_at = new Date();
  }
}
