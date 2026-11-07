"use client";

import React from "react";

export const TableSkeleton: React.FC<{ rows?: number }> = ({ rows = 8 }) => {
  return (
    <div className="w-full divide-y divide-slate-100 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="py-3 px-3 flex items-center justify-between gap-4">
          <div className="space-y-1.5 w-1/4">
            <div className="h-3.5 bg-slate-200 rounded w-20"></div>
            <div className="h-2.5 bg-slate-100 rounded w-28"></div>
          </div>
          <div className="space-y-1.5 w-1/4">
            <div className="h-3 bg-slate-200 rounded w-24"></div>
            <div className="h-2.5 bg-slate-100 rounded w-16"></div>
          </div>
          <div className="space-y-1.5 w-1/3">
            <div className="h-3.5 bg-slate-200 rounded w-3/4"></div>
            <div className="h-2.5 bg-slate-100 rounded w-1/2"></div>
          </div>
          <div className="h-5 bg-slate-200 rounded-full w-20 shrink-0"></div>
        </div>
      ))}
    </div>
  );
};

export const DetailSkeleton: React.FC = () => {
  return (
    <div className="flex-1 flex flex-col p-4 space-y-4 animate-pulse">
      {/* Action Toolbar Skeleton */}
      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
        <div className="flex gap-2">
          <div className="h-7 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-7 w-24 bg-slate-200 rounded-lg"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-7 w-24 bg-slate-200 rounded-lg"></div>
          <div className="h-7 w-32 bg-slate-200 rounded-lg"></div>
        </div>
      </div>

      {/* Header Strip Skeleton */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <div className="h-4 w-28 bg-slate-200 rounded"></div>
          <div className="h-4 w-32 bg-slate-100 rounded"></div>
        </div>
        <div className="h-6 w-3/4 bg-slate-300 rounded"></div>
      </div>

      {/* Metadata Strip */}
      <div className="grid grid-cols-4 gap-2 bg-slate-100 rounded-lg p-3">
        <div className="h-8 bg-slate-200 rounded"></div>
        <div className="h-8 bg-slate-200 rounded"></div>
        <div className="h-8 bg-slate-200 rounded"></div>
        <div className="h-8 bg-slate-200 rounded"></div>
      </div>

      {/* Chat Messages Skeleton */}
      <div className="space-y-3 pt-2 flex-1">
        <div className="p-4 bg-white border border-slate-200 rounded-xl space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-32 bg-slate-200 rounded"></div>
            <div className="h-3 w-20 bg-slate-100 rounded"></div>
          </div>
          <div className="h-12 bg-slate-100 rounded"></div>
        </div>
        <div className="p-4 bg-amber-50/50 border border-amber-200 rounded-xl space-y-2">
          <div className="flex justify-between">
            <div className="h-4 w-40 bg-amber-200/70 rounded"></div>
            <div className="h-3 w-20 bg-slate-100 rounded"></div>
          </div>
          <div className="h-8 bg-amber-100/50 rounded"></div>
        </div>
      </div>
    </div>
  );
};

export const ContextSkeleton: React.FC = () => {
  return (
    <div className="space-y-4 animate-pulse">
      <div className="flex justify-between items-center pb-2 border-b border-slate-200">
        <div className="h-4 w-36 bg-slate-200 rounded"></div>
        <div className="h-4 w-20 bg-slate-200 rounded"></div>
      </div>
      <div className="space-y-2">
        <div className="h-12 bg-rose-100/60 border border-rose-200 rounded-lg"></div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-slate-200 rounded"></div>
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
          </div>
          <div className="h-3.5 bg-slate-100 rounded w-full"></div>
        </div>
        <div className="p-3 bg-white border border-slate-200 rounded-lg space-y-2">
          <div className="flex justify-between">
            <div className="h-3 w-24 bg-slate-200 rounded"></div>
            <div className="h-3 w-16 bg-slate-200 rounded"></div>
          </div>
          <div className="h-3.5 bg-slate-100 rounded w-full"></div>
        </div>
      </div>
    </div>
  );
};

export const InsightsSkeleton: React.FC = () => {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="bg-white p-4 rounded-xl border border-slate-200 space-y-2">
            <div className="h-3 w-24 bg-slate-200 rounded"></div>
            <div className="h-7 w-16 bg-slate-300 rounded"></div>
            <div className="h-2.5 w-32 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
      <div className="space-y-4">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="bg-white p-5 rounded-xl border border-slate-200 space-y-3">
            <div className="flex justify-between">
              <div className="h-4 w-48 bg-slate-200 rounded"></div>
              <div className="h-6 w-16 bg-slate-200 rounded"></div>
            </div>
            <div className="h-14 bg-slate-100 rounded"></div>
          </div>
        ))}
      </div>
    </div>
  );
};
