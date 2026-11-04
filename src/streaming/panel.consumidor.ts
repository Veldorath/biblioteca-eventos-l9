import { Injectable, Logger, OnModuleDestroy, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  Consumer,
  MessagesStream,
  MessagesStreamFallbackModes,
  MessagesStreamModes,
  stringDeserializers,
  type Message,
} from '@platformatic/kafka';
import { plainToInstance } from 'class-transformer';
import { validateSync, type ValidationError } from 'class-validator';
import { EventoDto } from './evento.dto.js';
import { TOPICS } from './topics.js';

type Mensaje = Message<string, string, string, string>;

/**
 * El grupo biblioteca-panel lee ambos topics. Registra los eventos válidos y los
 * inválidos, y confirma cada mensaje después de procesarlo.
 */
@Injectable()
export class PanelConsumidor implements OnModuleInit, OnModuleDestroy {
  private readonly log = new Logger('biblioteca-panel');
  private readonly consumidor: Consumer<string, string, string, string>;
  private flujo?: MessagesStream<string, string, string, string>;

  constructor(config: ConfigService) {
    this.consumidor = new Consumer({
      groupId: 'biblioteca-panel',
      clientId: 'biblioteca-eventos',
      bootstrapBrokers: config.getOrThrow<string>('KAFKA_BROKERS').split(','),
      deserializers: stringDeserializers,
    });
  }

  async onModuleInit(): Promise<void> {
    this.flujo = await this.consumidor.consume({
      topics: [TOPICS.prestamos, TOPICS.lecturas],
      autocommit: false,
      mode: MessagesStreamModes.COMMITTED,
      fallbackMode: MessagesStreamFallbackModes.EARLIEST,
    });
    this.log.log(`grupo biblioteca-panel leyendo ${TOPICS.prestamos} y ${TOPICS.lecturas}`);
    void this.leer();
  }

  private async leer(): Promise<void> {
    try {
      for await (const m of this.flujo!) {
        this.registrar(m);
        await m.commit();
      }
    } catch (error) {
      this.log.error(`el consumidor se detuvo: ${(error as Error).message}`);
    }
  }

  private registrar(m: Mensaje): void {
    const donde = `${m.topic}[${m.partition}]@${m.offset}`;
    try {
      const evento = plainToInstance(EventoDto, JSON.parse(m.value));
      const errores = validateSync(evento, { whitelist: true, forbidNonWhitelisted: true });
      if (errores.length > 0) {
        this.log.warn(`${donde} INVALIDO: ${motivos(errores).join('; ')}`);
        return;
      }
      this.log.log(`${donde} ${evento.tipo} evento ${evento.eventoId} libro ${evento.libroId} usuario ${evento.usuarioSub}`);
    } catch (error) {
      this.log.warn(`${donde} INVALIDO: no es un JSON de evento (${(error as Error).message})`);
    }
  }

  async onModuleDestroy(): Promise<void> {
    await this.flujo?.close();
    await this.consumidor.close();
  }
}

function motivos(errores: ValidationError[], ruta = ''): string[] {
  return errores.flatMap((e) => [
    ...(e.constraints ? [`${ruta}${e.property} (${Object.keys(e.constraints).join(', ')})`] : []),
    ...motivos(e.children ?? [], `${ruta}${e.property}.`),
  ]);
}