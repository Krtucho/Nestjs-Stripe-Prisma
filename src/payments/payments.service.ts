import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { DatabaseService } from 'src/database/database.service';

@Injectable()
export class ProductsService {
  constructor(private readonly databaseService: DatabaseService){}

//   Cuando se realiza un pago en stripe tienes que guardar en la metadata a que Company se esta realizando el pago y el PaymentMethod. Cuando el pago fue exitoso capturas el evento y creas un Payment y actualizas Account. Creas una tarea programada que revisa el paymentDate de Payment y el data de PaymentMethod para ejecutar la transferencia (filtra solo Payment con status PENDIENTE). Para hacer esta operación haces una transferencia en stripe entre Account y Company pasando el dinero, guardas en la metadata de stripe el id Payment y de Account para cuando se verifique la transferencia actualizas los campos de Payment y Account.
  async makePayment(){
    // Despues de hacer el pago

    // Guardar Company y PaymentMethod en la metadata

    // Si el pago fue exitoso creo un evento

    // Creo un Payment

    // Actualizo account

    // Crear tarea programada(suscription)

    // 

  }  

  // async create(createProductDto: Prisma.ProductCreateInput) {
  //   return this.databaseService.product.create({ data: createProductDto});
  // }

  // async findAll() {
  //   return this.databaseService.product.findMany({
      
  //   });
  // }

  // async findOne(id: number) {
  //   return this.databaseService.product.findUnique({
  //     where: {
  //       id,
  //     }
  //   });
  // }

  // async update(id: number, updateProductDto: Prisma.ProductUpdateInput) {
  //   return this.databaseService.product.update({
  //     where: {
  //       id,
  //     },
  //     data: updateProductDto,
  //   });
  // }

  // async remove(id: number) {
  //   return this.databaseService.product.delete({
  //     where: {id},
  //   });
  // }
}
