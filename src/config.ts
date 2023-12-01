import YAML from 'js-yaml'
import fs from 'fs/promises'
import {makeLogger} from './logger.js'
import {ClientOptions} from './chia-http-api/client.js'
import {homedir} from 'os'
import { join } from 'path'

export class Config {
  private config: Record<string, any> = {}
  private readonly logger = makeLogger({ name: 'Config' })

  private constructor(private readonly configPath: string) {}

  public static async make({ configPath = 'config.yaml' } = {}): Promise<Config> {
    const config = new Config(configPath)
    await config.load()

    return config
  }

  public get wallets(): WalletConfig[] {
    return this.config.wallets || []
  }

  public get dispatchIntervalInSeconds(): number {
    return this.config.dispatchIntervalInSeconds || 10 * 60
  }

  public get waitForTransactionToConfirm(): boolean {
    return this.config.waitForTransactionToConfirm ?? true
  }

  private async load() {
    let file: string
    try {
      file = await fs.readFile(this.configPath, 'utf-8')
    } catch (err) {
      this.config = Config.defaultConfig
      await this.save()
      this.logger.info(`Default config written to ${this.configPath}, exiting ..`)
      process.exit()
    }
    this.config = YAML.load(file) as Record<string, any>
  }

  private async save() {
    const yaml = YAML.dump(this.config, {
      lineWidth: 140,
    })
    await fs.writeFile(this.configPath, yaml)
  }

  private static get defaultConfig(): ConfigInterface {
    return {
      wallets: [{
        name: 'Chia',
        ticker: 'XCH',
        connectionOptions: {
          url: 'https://127.0.0.1:9256',
          certFilePath: join(homedir(), '.chia', 'mainnet', 'config', 'ssl', 'wallet', 'private_wallet.crt'),
          keyFilePath: join(homedir(), '.chia', 'mainnet', 'config', 'ssl', 'wallet', 'private_wallet.key'),
        },
        sendTo: {
          address: 'xch1063ymlv3saaxkh87h287nc3laelnxss0897xdw6g8zj6yvaa4elslg0xfa',
        },
        decimalPlaces: 12,
      }],
    }
  }
}

interface ConfigInterface {
  wallets: WalletConfig[]
  dispatchIntervalInSeconds?: number
  waitForTransactionToConfirm?: boolean
}

export interface WalletConfig {
  name: string
  ticker: string
  disabled?: boolean
  connectionOptions: ClientOptions
  sendTo: SendingOptions
  decimalPlaces: number
  fee?: number
}

interface SendingOptions {
  address: string
  minimumAmount?: number
  maximumAmount?: number
  multiplesOf?: number
}
