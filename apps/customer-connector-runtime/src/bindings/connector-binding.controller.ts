import { Controller, Post, Req, Res } from '@nestjs/common';
import type { Request, Response } from 'express';
import { CONNECTOR_BINDING_MAX_REQUEST_BYTES } from '@internal-ai-assistant/connector-runtime-contract';
import { ConnectorBindingRequestService } from './connector-binding-request.service';

@Controller()
export class ConnectorBindingController {
  constructor(private readonly requests: ConnectorBindingRequestService) {}

  @Post('v1/internal/connector-bindings')
  async create(@Req() request: Request, @Res() response: Response): Promise<void> {
    const rawBody = await readBoundedBody(request, CONNECTOR_BINDING_MAX_REQUEST_BYTES + 1);
    const result = await this.requests.handle({
      method: request.method,
      contentType: singleHeader(request.headers['content-type']),
      contentEncoding: singleHeader(request.headers['content-encoding']),
      authorization: singleHeader(request.headers.authorization),
      rawBody
    });
    response.status(result.statusCode).type('application/json').send(result.body);
  }
}

async function readBoundedBody(request: Request, retainMaximum: number): Promise<Buffer> {
  const chunks: Buffer[] = [];
  let retained = 0;
  for await (const part of request) {
    const chunk = Buffer.isBuffer(part) ? part : Buffer.from(part as Uint8Array);
    if (retained < retainMaximum) {
      const kept = chunk.subarray(0, retainMaximum - retained);
      chunks.push(kept);
      retained += kept.byteLength;
    }
  }
  return Buffer.concat(chunks, retained);
}

function singleHeader(value: string | string[] | undefined): string | undefined {
  return typeof value === 'string' ? value : undefined;
}
