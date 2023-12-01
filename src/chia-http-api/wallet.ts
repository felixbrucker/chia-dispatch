import {BigNumber} from 'bignumber.js'

import {Client, ClientOptions, RpcResponse} from './client.js'

export class Wallet extends Client {
  public constructor(options: ClientOptions) {
    super(options)
  }

  public async isReachable(): Promise<boolean> {
    try {
      await this.getSyncStatus()

      return true
    } catch (err) {
      // Skip
    }

    return false
  }

  public async getWallets(): Promise<WalletInfo[]> {
    const { wallets } = await this.request<WalletsResponse>('get_wallets')

    return wallets
  }

  public async getBalance(options: GetBalanceOptions): Promise<WalletBalance> {
    const { wallet_balance } = await this.request<WalletBalanceResponse>('get_wallet_balance', options)

    return wallet_balance
  }

  public async getSyncStatus(): Promise<SyncStatusResponse> {
    return this.request<SyncStatusResponse>('get_sync_status')
  }

  public async getTransaction(options: GetTransactionOptions): Promise<TransactionWithId> {
    const { transaction, transaction_id } = await this.request<TransactionResponse>('get_transaction', options)

    return {
      id: transaction_id,
      ...transaction,
    }
  }

  public async sendTransaction(options: SendTransactionOptions): Promise<TransactionWithId> {
    const { transaction, transaction_id } = await this.request<TransactionResponse>('send_transaction', options)

    return {
      id: transaction_id,
      ...transaction,
    }
  }
}

type GetBalanceOptions = {
  wallet_id: number
}

type GetTransactionOptions = {
  transaction_id: string
}

type SendTransactionOptions = {
  wallet_id: number
  address: string
  amount: number
  fee: number
}

interface WalletsResponse extends RpcResponse {
  wallets: WalletInfo[]
}

interface WalletBalanceResponse extends RpcResponse {
  wallet_balance: WalletBalance
}

interface SyncStatusResponse extends RpcResponse {
  syncing: boolean
  synced: boolean
}

interface TransactionResponse extends RpcResponse {
  transaction: Transaction
  transaction_id: string
}

interface WalletInfo {
  id: number
  name: string
  type: WalletType
  data: string
}

export enum WalletType {
  STANDARD_WALLET = 0,
  RATE_LIMITED = 1,
  ATOMIC_SWAP = 2,
  AUTHORIZED_PAYEE = 3,
  MULTI_SIG = 4,
  CUSTODY = 5,
  CAT = 6,
  RECOVERABLE = 7,
  DISTRIBUTED_ID = 8,
  POOLING_WALLET = 9,
}

interface WalletBalance {
  wallet_id: number
  confirmed_wallet_balance: number|BigNumber
  unconfirmed_wallet_balance: number|BigNumber
  spendable_balance: number|BigNumber
  frozen_balance: number|BigNumber
  pending_change: number|BigNumber
  max_send_amount: number|BigNumber
  unspent_coin_count: number
  pending_coin_removal_count: number
}

interface TransactionWithId extends Transaction {
  id: string
}

interface Transaction {
  confirmed_at_height: number|BigNumber
  created_at_time: number
  to_puzzle_hash: string
  to_address: string
  amount: number|BigNumber
  fee_amount: number|BigNumber
  confirmed: boolean
  sent: number
  spend_bundle?: SpendBundle
  additions: Coin[]
  removals: Coin[]
  wallet_id: number
  name: string
  type: TransactionType
}

export enum TransactionType {
  INCOMING_TX = 0,
  OUTGOING_TX = 1,
  COINBASE_REWARD = 2,
  FEE_REWARD = 3,
  INCOMING_TRADE = 4,
  OUTGOING_TRADE = 5,
}

interface Coin {
  confirmed_block_index: number
  spent_block_index: number
  spent: boolean
  coinbase: boolean
  wallet_type: WalletType
  wallet_id: number
}

interface SpendBundle {
  coin_solutions: CoinSolution[]
  aggregated_signature: string
}

interface CoinSolution {
  coin: Coin,
  solution: object,
}
