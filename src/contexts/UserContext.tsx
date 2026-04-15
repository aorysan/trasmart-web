"use client";

import React, { createContext, useContext, useState } from "react";

export interface UserProfile {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  avatar: string;
}

interface UserContextType {
  user: UserProfile;
  updateUser: (updatedUser: UserProfile) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile>({
    fullName: "User",
    email: "example@gmail.com",
    phone: "+62 812-3456-7890",
    address: "Jl.Soekarno-Hatta No. 123, Malang",
    avatar: "👤",
  });

  const updateUser = (updatedUser: UserProfile) => {
    setUser(updatedUser);
  };

  return (
    <UserContext.Provider value={{ user, updateUser }}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
