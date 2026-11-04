import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CartasMuertasModule } from './mensajeria/consumidores/cartas-muertas.module.js';
import { AuditoriaModule } from './mensajeria/consumidores/auditoria.module.js';
import { CorreosModule } from './mensajeria/consumidores/correos.module.js';
import { NotificacionesModule } from './mensajeria/consumidores/notificaciones.module.js';
import { MensajeriaModule } from './mensajeria/mensajeria.module.js';
import { PersistenciaModule } from './persistencia/persistencia.module.js';
import { SaludController } from './salud.controller.js';
import { StreamingModule } from './streaming/streaming.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PersistenciaModule,
    MensajeriaModule,
    AuditoriaModule,
    NotificacionesModule,
    CorreosModule,
    CartasMuertasModule,
    StreamingModule,
  ],
  controllers: [SaludController],
})
export class AppModule {}
