export interface StockSummary {
  StockCode: string;
  Close: number;
  Change: number;
  Date: string;
  // Add other properties from your stock data as needed
}


export interface StockSummaryPasardana {
  Id: number;
  Name: string;
  Code: string;
  StockSubSectorId: number;
  SubSectorName: string;
  StockSectorId: number;
  SectorName: string;
  NewSubIndustryId: number;
  NewSubIndustryName: string;
  NewIndustryId: number;
  NewIndustryName: string;
  NewSubSectorId: number;
  NewSubSectorName: string;
  NewSectorId: number;
  NewSectorName: string;
  Last: number;
  PrevClosingPrice: number;
  AdjustedClosingPrice: number;
  AdjustedOpenPrice: number;
  AdjustedHighPrice: number;
  AdjustedLowPrice: number;
  Volume: number;
  Frequency: number;
  Value: number;
  OneDay: number;
  OneWeek: number;
  OneMonth: number;
  ThreeMonth: number;
  SixMonth: number;
  OneYear: number;
  ThreeYear: number;
  FiveYear: number;
  TenYear: number;
  Mtd: number;
  Ytd: number;
  Per: number;
  Pbr: number;
  Capitalization: number;
  BetaOneYear: number;
  StdevOneYear: number;
  PerAnnualized: number;
  PsrAnnualized: number;
  PcfrAnnualized: number;
  AdjustedAnnualHighPrice: number;
  AdjustedAnnualLowPrice: number;
  LastDate: string;
  LastUpdate: string;
  Roe: number;
}
