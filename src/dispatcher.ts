import {Config, WalletConfig} from './config'
import {Wallet, WalletType} from './chia-http-api/wallet'
import {make} from './logger'
import {sleep} from './util/sleep'
import {CurrencyAmount} from './currency-amount'
import BigNumber from 'bignumber.js'

export class Dispatcher {
  private readonly logger = make({ name: 'Dispatcher' })

  public constructor(private readonly config: Config) {}

  public async init() {
    await this.dispatch()
    setInterval(this.dispatch.bind(this), 10 * 60 * 1000)
    this.logger.info('Initialized')
  }

  private async dispatch(): Promise<void> {
    const walletsToDispatch = this.config.wallets.filter(wallet => !wallet.disabled)
    await Promise.all(walletsToDispatch.map(async wallet => {
      try {
        await this.dispatchWallet(wallet)
      } catch (err) {
        this.logger.error(`Error while dispatching wallet ${wallet.name}: ${err.message}`)
      }
    }))
  }

  private async dispatchWallet(wallet: WalletConfig): Promise<void> {
    const logger = this.logger.getChildLogger({ name: `Dispatcher | ${wallet.name}` })
    const apiClient = new Wallet(wallet.connectionOptions)

    let isReachable = await apiClient.isReachable()
    if (!isReachable) {
      logger.info(`Wallet is unreachable, waiting for it to become reachable ..`)
    }
    while (!isReachable) {
      await sleep(10 * 1000)
      isReachable = await apiClient.isReachable()
    }

    let syncStatus = await apiClient.getSyncStatus()
    if (syncStatus.syncing || !syncStatus.synced) {
      logger.info(`Wallet is syncing, waiting for it to become synced ..`)
    }
    while (syncStatus.syncing || !syncStatus.synced) {
      await sleep(10 * 1000)
      syncStatus = await apiClient.getSyncStatus()
    }

    const wallets = await apiClient.getWallets()
    const firstNormalWallet = wallets.find(walletInfo => walletInfo.type === WalletType.STANDARD_WALLET)
    if (firstNormalWallet === undefined) {
      logger.error(`No wallet available to send from`)

      return
    }
    const walletId = firstNormalWallet.id

    const { spendable_balance } = await apiClient.getBalance({ wallet_id: walletId })
    const spendableBalance = CurrencyAmount.fromSmallestUnit(spendable_balance)

    const fee = CurrencyAmount.from(wallet.fee || 0, { decimalPlaces: wallet.decimalPlaces })
    let amountToSend = spendableBalance
      .to({ decimalPlaces: wallet.decimalPlaces })
      .minus(fee.to({ decimalPlaces: wallet.decimalPlaces }))

    if (wallet.sendTo.multiplesOf !== undefined) {
      amountToSend = amountToSend
        .dividedBy(wallet.sendTo.multiplesOf)
        .integerValue(BigNumber.ROUND_FLOOR)
        .multipliedBy(wallet.sendTo.multiplesOf)
    }

    const minimumAmount = wallet.sendTo.minimumAmount || 0
    if (amountToSend.isLessThan(minimumAmount) || amountToSend.isLessThanOrEqualTo(0)) {
      return
    }
    if (wallet.sendTo.maximumAmount !== undefined) {
      amountToSend = BigNumber.minimum(amountToSend, wallet.sendTo.maximumAmount)
    }

    logger.info(`Sending ${amountToSend} ${wallet.ticker} to ${wallet.sendTo.address} ..`)
    let transaction = await apiClient.sendTransaction({
      wallet_id: walletId,
      address: wallet.sendTo.address,
      fee: fee.toSmallestUnit().toNumber(),
      amount: CurrencyAmount.from(amountToSend, { decimalPlaces: wallet.decimalPlaces }).toSmallestUnit().toNumber(),
    })

    if (!transaction.confirmed) {
      logger.info(`Waiting for transaction to confirm ..`)
    }
    while (!transaction.confirmed) {
      await sleep(10 * 1000)
      transaction = await apiClient.getTransaction({ transaction_id: transaction.id })
    }

    logger.info(`Done sending to ${wallet.sendTo.address}`)
  }
}
