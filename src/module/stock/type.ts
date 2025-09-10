export interface Stock {
    code: string;
    buyPrice: number;
    currentPrice: number;
    change: number;
    stopLoss: number;
    takeProfit: number;
}