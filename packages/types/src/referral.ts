export interface ReferralStats {
  referralCode: string;
  referralCount: number;       // оплативших
  pendingCount: number;        // в работе, ещё не оплатили
  freeToursAvailable: number;
  threshold: number;           // обычно 50, может отличаться по туру
  clicks: number;              // всего переходов
  registrations: number;       // зарегистрировались по реф-ссылке
  progressPercent: number;     // 0-100
}

export interface ReferralProgress {
  current: number;
  target: number;
  percent: number;
  remaining: number;
}
