import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
} from 'typeorm';

@Entity('crypto_prices')
export class CryptoPriceEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  pair: string;

  @Column('decimal', { precision: 18, scale: 8 })
  price: number;

  @CreateDateColumn()
  timestamp: Date;
}
