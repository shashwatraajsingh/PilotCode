import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Kafka, Producer, Consumer, EachMessagePayload } from 'kafkajs';

@Injectable()
export class KafkaService implements OnModuleInit, OnModuleDestroy {
  private kafka: Kafka;
  private producer: Producer;
  private consumers: Map<string, Consumer> = new Map();

  constructor(private configService: ConfigService) { }

  async onModuleInit() {
    try {
      const brokers = this.configService.get('KAFKA_BROKERS');
      if (!brokers) {
        console.error('KAFKA_BROKERS environment variable is not set');
        return;
      }

      this.kafka = new Kafka({
        clientId: 'devin-ai',
        brokers: brokers.split(','),
        retry: {
          initialRetryTime: 100,
          retries: 8,
        },
      });

      this.producer = this.kafka.producer();
      await this.producer.connect();
      console.log('Kafka connected successfully');
    } catch (error) {
      console.error('Failed to connect to Kafka:', error.message);
      console.log('Application will continue without Kafka functionality');
    }
  }

  async onModuleDestroy() {
    if (this.producer) {
      await this.producer.disconnect();
    }
    for (const consumer of this.consumers.values()) {
      await consumer.disconnect();
    }
  }

  async publish(topic: string, message: any): Promise<void> {
    if (!this.producer) {
      console.warn('Kafka producer not initialized, skipping publish');
      return;
    }

    try {
      await this.producer.send({
        topic,
        messages: [
          {
            value: JSON.stringify(message),
            timestamp: Date.now().toString(),
          },
        ],
      });
    } catch (error) {
      console.error(`Failed to publish to Kafka topic ${topic}:`, error.message);
    }
  }

  async subscribe(
    topic: string,
    groupId: string,
    handler: (payload: EachMessagePayload) => Promise<void>,
  ): Promise<void> {
    if (!this.kafka) {
      console.warn('Kafka not initialized, skipping subscription');
      return;
    }

    try {
      const consumer = this.kafka.consumer({ groupId });
      await consumer.connect();
      await consumer.subscribe({ topic, fromBeginning: false });

      await consumer.run({
        eachMessage: handler,
      });

      this.consumers.set(`${topic}-${groupId}`, consumer);
      console.log(`Subscribed to Kafka topic: ${topic} with group: ${groupId}`);
    } catch (error) {
      console.error(`Failed to subscribe to Kafka topic ${topic}:`, error.message);
    }
  }
}
