export interface StockData {
  data: Array<{
    No: number;
    IDStockSummary: number;
    Date: string;
    StockCode: string;
    StockName: string;
    Previous: number;
    OpenPrice: number;
    FirstTrade: number;
    High: number;
    Low: number;
    Close: number;
    Change: number;
    Volume: number;
    Value: number;
    Frequency: number;
    IndexIndividual: number;
    Offer: number;
    OfferVolume: number;
    Bid: number;
    BidVolume: number;
    ListedShares: number;
    TradebleShares: number;
    WeightForIndex: number;
    ForeignSell: number;
    ForeignBuy: number;
  }>;
  draw: number;
  recordsTotal: number;
  recordsFiltered: number;
}