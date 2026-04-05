function parseShare(raw: string | undefined): number {
  const n = raw ? Number.parseFloat(raw) : Number.NaN;
  if (!Number.isFinite(n) || n < 0 || n > 1) return 0.65;
  return n;
}

export function splitUsagePoints(pointsCharged: number): {
  creatorEarningsPt: number;
  platformFeePt: number;
} {
  if (pointsCharged <= 0) {
    return { creatorEarningsPt: 0, platformFeePt: 0 };
  }
  const share = parseShare(process.env.CREATOR_REVENUE_SHARE);
  const creatorEarningsPt = Math.floor(pointsCharged * share);
  const platformFeePt = pointsCharged - creatorEarningsPt;
  return { creatorEarningsPt, platformFeePt };
}
