interface Window {
  showSaveFilePicker?: (options?: {
    suggestedName?: string;
    types?: {
      description?: string;
      accept: Record<string, string[]>;
    }[];
  }) => Promise<FileSystemFileHandle>;
}

interface FileSystemFileHandle {
  createWritable(): Promise<FileSystemWritableFileStream>;
}

interface FileSystemWritableFileStream {
  write(data: Blob | BufferSource | string): Promise<void>;
  close(): Promise<void>;
}

// NextAuth type extensions
declare module "next-auth" {
  interface User {
    id: string;
    accountType: string;
    sessionToken: string | null;
    role: import("@prisma/client").Role;
    email: string;
    firstName: string;
    lastName: string;
  }
  interface Session {
    user: User & {
      name?: string | null;
      email?: string | null;
      image?: string | null;
    };
  }
}

declare module "next-auth/jwt" {
  interface JWT {
    id: string;
    accountType: string;
    sessionToken: string | null;
    role: import("@prisma/client").Role;
    email: string;
    firstName: string;
    lastName: string;
    exp?: number;
  }
}
