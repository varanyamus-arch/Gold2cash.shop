"use client";

import React from "react";
import MetalPriceBoard, { MetalPriceItem } from "./MetalPriceBoard";

export interface DashboardProps {
  gold?: MetalPriceItem;
  silver?: MetalPriceItem;
  updatedAt?: string;
  loading?: boolean;
  children?: React.ReactNode;
}

export default function Dashboard({
  gold,
  silver,
  updatedAt,
  loading = false,
  children,
}: DashboardProps) {
  return (
    <div className="dashboard-wrapper">
      {/* Price Board positioned at top */}
      <MetalPriceBoard
        gold={gold}
        silver={silver}
        updatedAt={updatedAt}
        loading={loading}
      />
      
      {/* Rest of Dashboard content */}
      {children}
    </div>
  );
}
