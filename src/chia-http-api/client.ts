import {Agent} from 'https';
import {readFileSync} from 'fs';
import axios, {AxiosError, AxiosInstance} from 'axios';
import {parse} from 'json-bigint';

export interface ClientOptions {
  url: string,
  certFilePath: string,
  keyFilePath: string,
}

export interface RpcResponse {
  success: boolean,
  error?: string,
}

export class Client {
  private readonly client: AxiosInstance

  protected constructor(options: ClientOptions) {
    this.client = axios.create({
      baseURL: options.url,
      httpsAgent: new Agent({
        cert: readFileSync(options.certFilePath),
        key: readFileSync(options.keyFilePath),
        rejectUnauthorized: false,
      }),
      transformResponse: (data => parse(data)),
      timeout: 60 * 1000,
    })
  }

  protected async request<T extends RpcResponse>(
    route: string,
    body?: Record<string, string | number | boolean | string[] | any | undefined>
  ) {
    try {
      const { data } = await this.client.post<T>(route, body || {})
      if (data.error) {
        throw new Error(data.error)
      }
      if (!data.success) {
        throw new Error(`Request failed, got ${JSON.stringify(data)}`)
      }

      return data
    } catch (error: AxiosError|any) {
      if (error?.response?.data?.error) {
        throw new AggregateError([error], error.response.data.error)
      }

      throw error
    }
  }
}
