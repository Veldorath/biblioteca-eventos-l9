import { Module } from '@nestjs/common';
import { PanelConsumidor } from './panel.consumidor.js';

@Module({
  providers: [PanelConsumidor],
})
export class StreamingModule {}