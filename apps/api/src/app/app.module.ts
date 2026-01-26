import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from '../prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ProductsModule } from '../products/products.module';
import { SalesModule } from '../sales/sales.module';
import { CustomersModule } from '../customers/customers.module';
import { InventoryModule } from '../inventory/inventory.module';
import { AccountingModule } from '../accounting/accounting.module';

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    ProductsModule,
    SalesModule,
    CustomersModule,
    InventoryModule,
    AccountingModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
