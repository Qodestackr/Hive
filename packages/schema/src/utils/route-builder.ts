import { z } from "zod";
import { registry } from "../openapi-registry.js";

type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'delete';

interface RouteConfig {
  method: HttpMethod;
  path: string;
  summary: string;
  description?: string;
  tags?: string[];
  body?: z.ZodType<any>;
  params?: z.ZodObject<any>;
  query?: z.ZodObject<any>;
  response: z.ZodType<any>;
  errors?: {
    [statusCode: number]: string;
  };
}

export function registerRoute(config: RouteConfig) {
  const {
    method,
    path,
    summary,
    description,
    tags = [],
    body,
    params,
    query,
    response,
    errors = {},
  } = config;

  const request: any = {};

  if (body) {
    request.body = {
      content: {
        'application/json': { schema: body },
      },
    };
  }

  if (params) request.params = params;
  if (query) request.query = query;

  const responses: any = {
    200: {
      description: 'Successful response',
      content: {
        'application/json': { schema: response },
      },
    },
  };

  // Add error responses
  for (const [code, desc] of Object.entries(errors)) {
    responses[code] = { description: desc };
  }

  registry.registerPath({
    method,
    path,
    summary,
    description,
    tags,
    request,
    responses,
  });
}