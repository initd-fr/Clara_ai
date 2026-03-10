export type User = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  isOnline: boolean;
  accountType: string; // Changé pour être dynamique
  isPaid: boolean;
  currentDailyMessages: number;
  lastConnection: Date | null;
  userImage: string | null;
  lastReset: Date | null;
};
