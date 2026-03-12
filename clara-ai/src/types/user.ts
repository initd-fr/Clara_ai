export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  isOnline: boolean;
  accountType: string;
  isPaid: boolean;
  currentDailyMessages: number;
  lastConnection: Date | null;
  userImage: string | null;
  lastReset: Date | null;
};
