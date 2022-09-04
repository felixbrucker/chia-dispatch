import BigNumber from 'bignumber.js';

type ConversionOptions = {
  decimalPlaces: number
}

export class CurrencyAmount {
  public static fromSmallestUnit(rawValue: string | number | BigNumber): CurrencyAmount {
    return CurrencyAmount.from(rawValue, { decimalPlaces: 0 })
  }

  public static from(rawValue: string | number | BigNumber, options: ConversionOptions): CurrencyAmount {
    return new CurrencyAmount(new BigNumber(rawValue).shiftedBy(options.decimalPlaces).integerValue(BigNumber.ROUND_FLOOR))
  }

  private constructor(private currencyInSmallestUnit: BigNumber) {}

  public to(options: ConversionOptions): BigNumber {
    return this.currencyInSmallestUnit.shiftedBy(-options.decimalPlaces)
  }

  public toSmallestUnit(): BigNumber {
    return this.currencyInSmallestUnit
  }

  public toString(decimalPlaces = 0): string {
    return this.to({ decimalPlaces }).toString();
  }
}
