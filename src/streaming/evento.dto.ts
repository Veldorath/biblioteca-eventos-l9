import { Type } from 'class-transformer';
import {
  Equals, IsIn, IsInt, IsISO8601, IsNotEmpty, IsString, IsUUID, Matches, Min, ValidateIf, ValidateNested,
} from 'class-validator';

export const TIPOS = [
  'prestamo.creado',
  'prestamo.devuelto',
  'lectura.iniciada',
  'lectura.terminada',
  'capitulo.terminado',
] as const;
export type TipoEvento = (typeof TIPOS)[number];

const FECHA = /^\d{4}-\d{2}-\d{2}$/;

class DatosPrestamoCreadoDto {
  @IsString() @IsNotEmpty() prestamoId!: string;
  @Matches(FECHA, { message: 'desde tiene que ser una fecha AAAA-MM-DD' }) @IsISO8601({ strict: true }) desde!: string;
  @Matches(FECHA, { message: 'hasta tiene que ser una fecha AAAA-MM-DD' }) @IsISO8601({ strict: true }) hasta!: string;
}

class DatosPrestamoDevueltoDto {
  @IsString() @IsNotEmpty() prestamoId!: string;
}

class DatosLecturaIniciadaDto {
  @IsString() @IsNotEmpty() sesionId!: string;
  @IsString() @IsNotEmpty() dispositivo!: string;
}

class DatosLecturaTerminadaDto {
  @IsString() @IsNotEmpty() sesionId!: string;
  @IsInt() @Min(0) paginasLeidas!: number;
  @IsInt() @Min(0) duracionSeg!: number;
  @IsIn(['completada', 'abandonada', 'error']) resultado!: string;
}

class DatosCapituloTerminadoDto {
  @IsString() @IsNotEmpty() sesionId!: string;
  @IsInt() @Min(1) capitulo!: number;
}

const DATOS_POR_TIPO: Record<TipoEvento, new () => object> = {
  'prestamo.creado': DatosPrestamoCreadoDto,
  'prestamo.devuelto': DatosPrestamoDevueltoDto,
  'lectura.iniciada': DatosLecturaIniciadaDto,
  'lectura.terminada': DatosLecturaTerminadaDto,
  'capitulo.terminado': DatosCapituloTerminadoDto,
};

/**
 * El sobre de todo evento (contrato de la unidad 3), con los dos topics que lee este consumidor.
 * `libroId` viaja como string, tambien en biblioteca.lecturas, donde es la key.
 */
export class EventoDto {
  @IsUUID()
  eventoId!: string;

  @IsIn(TIPOS)
  tipo!: TipoEvento;

  @Equals(1, { message: 'version tiene que ser 1' })
  version!: number;

  @IsISO8601({ strict: true })
  emitidoEn!: string;

  @IsString()
  @IsNotEmpty()
  libroId!: string;

  @IsString()
  @IsNotEmpty()
  usuarioSub!: string;

  // Los datos dependen del tipo. Si el tipo no existe, ya falla `tipo` y aqui no se valida nada mas.
  @ValidateIf((e: EventoDto) => TIPOS.includes(e.tipo))
  @ValidateNested()
  @Type((opciones) => DATOS_POR_TIPO[opciones?.object?.tipo as TipoEvento] ?? Object)
  datos!: object;
}