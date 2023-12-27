/* eslint-disable prettier/prettier */
import { Injectable } from '@nestjs/common';
import { aql } from 'arangojs';
import { ArangoRepository, InjectRepository, ResultList } from 'nest-arango';
import { MyDatabase } from 'src/database/database';
import { ProductEntity } from 'src/entities/product/product.entity';
import { ReportEntity } from 'src/entities/report/report.entity';
import { ReportService } from '../report/report.service';

@Injectable()
export class ProductService {
  constructor(
    @InjectRepository(ProductEntity)
    private readonly productRepository: ArangoRepository<ProductEntity>,
    private readonly reportService: ReportService,
  ) {}
  async create(product: ProductEntity): Promise<object> {
    const cursor = await MyDatabase.getDb().query(aql`
      FOR product IN Products
      FILTER product.product_id == ${product.product_id}
      RETURN product
    `);
    const isExist = await cursor.all();
    if (isExist.length > 0) {
      return { error: 'the product already exist' };
    } else {
      if (await MyDatabase.supplierIsExist(product.supplier_id)) {
        if (await MyDatabase.categoryIsExist(product.category_id)) {
          const ReportCollectionSize = MyDatabase.getDb()
            .collection('Reports')
            .count();
          const report: ReportEntity = {
            report_id: `${(await ReportCollectionSize).count + 1}`,
            title: 'ایجاد محصول با ایدی' + product.product_id,
            content: ["محصول با ایدی ' + product.product_id + 'به مقدار ' + product.balance + 'ایجاد شد"],
            type: null,
            date: new Date(),
            product_id: product.product_id,
            amount: product.balance,
          };
          await this.reportService.create(report);
          await this.productRepository.save(product);
          return {
            result:
              'the product with name  ' + product.product_name + ' created',
          };
        } else {
          return { error: 'the category doesnt exist' };
        }
      } else {
        return { error: 'this supplier doesnt exist' };
      }
    }
  }

  async findAll(): Promise<ResultList<ProductEntity>> {
    return await this.productRepository.findAll();
  }

  async updateProduct(updatedProduct: ProductEntity): Promise<object> {
    const newAndOldProduct = await MyDatabase.getDb().query(aql`
      FOR product IN Products
      FILTER product.product_id == ${updatedProduct.product_id}
      UPDATE product._key WITH ${updatedProduct} IN Products
      RETURN {
        oldProduct : OLD,
        newProduct : NEW,
      }
    `);
    const updateOutput = await newAndOldProduct.next();
    if (updateOutput) {
      // console.log(isUpdated.oldProduct.balance);
      const ReportCollectionSize = MyDatabase.getDb()
        .collection('Reports')
        .count();
      const diffrence = {
        oldPrice: updateOutput.oldProduct.price,
        newPrice: updateOutput.newProduct.price,
        oldSupplierId: updateOutput.oldProduct.supplier_id,
        newSupplierId: updateOutput.newProduct.supplier_id,
        oldBalance: updateOutput.oldProduct.balance,
        newBalance: updateOutput.newProduct.balance,
      };
      // eslint-disable-next-line prefer-const
      let content: string[] = [];
      if (diffrence.oldPrice !== diffrence.newPrice) {
        content.push(`قیمت محصول از  ${diffrence.oldPrice}  به  ${diffrence.newPrice}  تغییر کرد `);
      }
      if (diffrence.oldSupplierId !== diffrence.newSupplierId) {
        const cursor = await MyDatabase.getDb().query(aql`
          FOR s IN Suppliers
          FILTER s.supplier_id == ${diffrence.oldSupplierId}
          RETURN s.supplier_name
        `);
        const oldSupplierName = await cursor.next();
        const cursor2 = await MyDatabase.getDb().query(aql`
          FOR s IN Suppliers
          FILTER s.supplier_id == ${diffrence.newSupplierId}
          RETURN s.supplier_name
        `);
        const NewSupplierName = await cursor2.next();
        content.push(`نام تامین کننده محصول از  ${oldSupplierName} به  ${NewSupplierName} تغییر کرد `);
      }
      if (diffrence.oldBalance !== diffrence.newBalance) {
        content.push(`موجودی محصول از ${diffrence.oldBalance} به  ${diffrence.newBalance} تغییر کرد`);
      }

      const report: ReportEntity = {
        report_id: `${(await ReportCollectionSize).count + 1}`,
        title:
          'محصول با ایدی  ' + updateOutput.oldProduct.product_id + ' تغییر کرد ',
        content: content,
        type: null,
        date: new Date(),
        product_id: updateOutput.oldProduct.product_id,
        amount: null,
      };
      this.reportService.create(report);
      return { result: 'the product is updated' };
    } else {
      return { error: 'the product doesnt exist' };
    }
  }

  async removeProduct(product_id: string): Promise<object> {
    const deletedProduct = await MyDatabase.getDb().query(aql`
      FOR product IN Products
      FILTER product.product_id == ${product_id}
      REMOVE product IN Products
      RETURN OLD
    `);
    const isDeleted = deletedProduct.all();
    if ((await isDeleted).length > 0) {
      return isDeleted;
    } else {
      return { error: 'the product doesnt exist' };
    }
  }
}
