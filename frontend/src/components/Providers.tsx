"use client";

import React, { ReactNode } from "react";
import { AuthProvider } from "../context/AuthContext";
import { AuthModal } from "./AuthModal";
import { RbacBlockModal } from "./RbacBlockModal";

export const Providers: React.FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <AuthProvider>
      {children}
      <AuthModal />
      <RbacBlockModal />
    </AuthProvider>
  );
};
