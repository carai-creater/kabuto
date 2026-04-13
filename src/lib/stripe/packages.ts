export const POINT_PACKAGES = [
  { id: "pt_500",  amountYen: 500,  amountPt: 500,  label: "500 pt",   bonus: "" },
  { id: "pt_1000", amountYen: 1000, amountPt: 1100, label: "1,100 pt", bonus: "+100 pt ボーナス" },
  { id: "pt_3000", amountYen: 3000, amountPt: 3500, label: "3,500 pt", bonus: "+500 pt ボーナス" },
] as const;

export type PointPackageId = (typeof POINT_PACKAGES)[number]["id"];
