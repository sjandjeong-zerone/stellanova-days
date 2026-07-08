"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Search, ChevronLeft, ChevronRight, Plus } from "lucide-react";
import Link from "next/link";

interface Entry {
  id: number;
  date: string;
  title: string;
  summary: string;
  tags: string[];
  created_at: string;
}

// Generate date grid for a given year/month
const generateCalendarDays = (year: number, month: number) => {
  const firstDay = new Date(year, month - 1, 1).getDay();
  const daysInMonth = new Date(year, month, 0).getDate();
  const days: (number | null)[] = [];
  for (let i = 0; i < firstDay; i++) days.push(null);
  for (let i = 1; i <= daysInMonth; i++) days.push(i);
  return days;
};

export default function Home() {
  const today = new Date();
  const [viewYear, setViewYear] = useState(2026);
  const [viewMonth, setViewMonth] = useState(7);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [entries, setEntries] = useState<Entry[]>([]);
  const [loading, setLoading] = useState(true);
  const [allTags, setAllTags] = useState<string[]>([]);

  // Fetch entries from API
  useEffect(() => {
    setLoading(true);
    const month = `${viewYear}-${String(viewMonth).padStart(2, "0")}`;
    fetch(`/api/entries?month=${month}`)
      .then((res) => res.json())
      .then((data: Entry[]) => {
        setEntries(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [viewYear, viewMonth]);

  // Collect all tags from all entries
  useEffect(() => {
    const all = new Set<string>();
    entries.forEach((e) => e.tags.forEach((t) => all.add(t)));
    setAllTags([...all].sort());
  }, [entries]);

  // Filter by selected day and tag
  const displayedEntries = useMemo(() => {
    let result = entries;
    if (selectedDay !== null) {
      result = result.filter((d) => new Date(d.date).getDate() === selectedDay);
    }
    if (selectedTag !== null) {
      result = result.filter((d) => d.tags.includes(selectedTag));
    }
    return result;
  }, [entries, selectedDay, selectedTag]);

  const calendarDays = generateCalendarDays(viewYear, viewMonth);
  const weekDays = ["일", "월", "화", "수", "목", "금", "토"];

  const prevMonth = useCallback(() => {
    setSelectedDay(null);
    setSelectedTag(null);
    if (viewMonth === 1) {
      setViewYear(viewYear - 1);
      setViewMonth(12);
    } else {
      setViewMonth(viewMonth - 1);
    }
  }, [viewYear, viewMonth]);

  const nextMonth = useCallback(() => {
    setSelectedDay(null);
    setSelectedTag(null);
    if (viewMonth === 12) {
      setViewYear(viewYear + 1);
      setViewMonth(1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  }, [viewYear, viewMonth]);

  const hasEntry = (day: number) =>
    entries.some((d) => new Date(d.date).getDate() === day);

  return (
    <div className="min-h-screen bg-white">
      {/* Top Banner */}
      <div className="bg-stellanova text-white text-center py-1.5 text-[11px] sm:text-xs tracking-wide px-4">
        소중한 사람에게 전하는 가장 빛나는 마음 — StellaNova Days
      </div>

      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img
              src="/stellanova-logo.png"
              alt="StellaNova"
              className="h-7 sm:h-10 w-auto"
            />
            <span className="text-base sm:text-lg font-light text-stellanova tracking-wide">
              Days
            </span>
          </div>
          <div className="flex items-center gap-2 sm:gap-3">
            <Link
              href="/capture"
              className="flex items-center gap-1 sm:gap-1.5 bg-stellanova text-white rounded-full px-3 sm:px-4 py-1.5 sm:py-2 text-xs sm:text-sm font-medium hover:bg-stellanova/90 transition-colors shadow-sm"
            >
              <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
              기록 추가
            </Link>
            <div className="relative">
              <Search className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="검색"
                className="bg-gray-50 border border-gray-200 rounded-full pl-8 sm:pl-9 pr-3 sm:pr-4 py-1.5 sm:py-2 text-xs sm:text-sm focus:outline-none focus:border-stellanova/30 focus:ring-2 focus:ring-stellanova/10 w-28 sm:w-48 transition-all"
              />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {/* Hero */}
        <div className="mb-8 sm:mb-12">
          <p className="text-[10px] sm:text-xs text-stellanova uppercase tracking-[0.15em] sm:tracking-[0.2em] mb-2 sm:mb-3 font-medium">
            Daily Progress Journal
          </p>
          <h2 className="text-xl sm:text-3xl font-light text-gray-900 leading-tight mb-2 sm:mb-3">
            매일의 기록이
            <br />
            <span className="font-medium text-stellanova">빛나는 자산</span>이 됩니다
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm leading-relaxed max-w-md">
            카카오톡 대화, 회의록, 결정 사항이 하루 단위로 정리되고,
            AI가 요약해 드립니다.
          </p>
        </div>

        {/* Stats */}
        <div className="flex gap-6 sm:gap-8 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b border-gray-100">
          {[
            { label: "총 일지", value: String(entries.length) },
            { label: `${viewMonth}월 기록`, value: `${displayedEntries.length}건` },
            { label: "태그", value: String(allTags.length) },
          ].map((s) => (
            <div key={s.label}>
              <p className="text-xl sm:text-2xl font-medium text-gray-900">{s.value}</p>
              <p className="text-[11px] sm:text-xs text-gray-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Calendar Navigator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={prevMonth}
              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
            <h3 className="text-sm sm:text-base font-medium text-gray-900">
              {viewYear}년 {viewMonth}월
            </h3>
            <button
              onClick={nextMonth}
              className="p-1.5 sm:p-2 rounded-full hover:bg-gray-100 transition-colors"
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-400" />
            </button>
          </div>

          <div className="bg-gray-50 rounded-xl p-3 sm:p-4">
            <div className="grid grid-cols-7 mb-2">
              {weekDays.map((d) => (
                <div
                  key={d}
                  className="text-center text-[10px] sm:text-xs text-gray-400 font-medium py-1"
                >
                  {d}
                </div>
              ))}
            </div>
            <div className="grid grid-cols-7 gap-1">
              {calendarDays.map((day, i) =>
                day === null ? (
                  <div key={`e-${i}`} />
                ) : (
                  <button
                    key={day}
                    onClick={() =>
                      setSelectedDay(selectedDay === day ? null : day)
                    }
                    className={`aspect-square rounded-lg text-xs sm:text-sm flex items-center justify-center transition-colors cursor-pointer ${
                      selectedDay === day
                        ? "bg-stellanova text-white font-medium ring-2 ring-stellanova/30"
                        : day === today.getDate() &&
                          viewMonth === today.getMonth() + 1 &&
                          viewYear === today.getFullYear()
                        ? "bg-stellanova text-white font-medium"
                        : hasEntry(day)
                        ? "bg-stellanova/10 text-stellanova hover:bg-stellanova/20 font-medium"
                        : "text-gray-500 hover:bg-gray-100"
                    }`}
                  >
                    {day}
                  </button>
                )
              )}
            </div>
          </div>
        </div>

        {/* Tag Filter */}
        <div className="flex items-center gap-1.5 sm:gap-2 mb-6 flex-wrap">
          {selectedDay !== null && (
            <button
              onClick={() => setSelectedDay(null)}
              className="px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs bg-stellanova text-white hover:bg-stellanova/90 transition-colors"
            >
              ✕ {viewMonth}월 {selectedDay}일
            </button>
          )}
          {allTags.map((tag) => (
            <button
              key={tag}
              onClick={() =>
                setSelectedTag(selectedTag === tag ? null : tag)
              }
              className={`px-2.5 py-1 sm:px-3 sm:py-1.5 rounded-full text-[11px] sm:text-xs border transition-colors ${
                selectedTag === tag
                  ? "bg-stellanova text-white border-stellanova"
                  : "border-gray-200 text-gray-500 hover:border-stellanova/30 hover:text-stellanova hover:bg-stellanova/5"
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Timeline */}
        {loading ? (
          <div className="text-center py-16 text-gray-400">
            <div className="w-5 h-5 border-2 border-stellanova/30 border-t-stellanova rounded-full animate-spin mx-auto mb-3" />
            <p className="text-sm">기록을 불러오는 중...</p>
          </div>
        ) : displayedEntries.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-sm">이 날에는 아직 기록이 없습니다</p>
          </div>
        ) : (
          <div className="space-y-0">
            {displayedEntries.map((entry) => {
              const d = new Date(entry.date);
              const isToday = today.toDateString() === d.toDateString();

              return (
                <Link
                  href={`/day/${entry.date}`}
                  key={entry.id}
                  className="group block relative pl-8 sm:pl-10 pb-8 sm:pb-10 border-l border-gray-100 last:border-transparent"
                >
                  <div
                    className={`absolute left-0 top-1.5 -translate-x-1/2 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full border-2 transition-colors ${
                      isToday
                        ? "bg-stellanova border-stellanova"
                        : "bg-white border-gray-200 group-hover:border-stellanova group-hover:bg-stellanova/10"
                    }`}
                  />
                  <span className="text-[11px] sm:text-xs text-gray-400 mb-1.5 block">
                    {d.toLocaleDateString("ko-KR", {
                      month: "long",
                      day: "numeric",
                      weekday: "short",
                    })}
                    {isToday && (
                      <span className="ml-1.5 text-[10px] text-stellanova font-medium">
                        TODAY
                      </span>
                    )}
                  </span>
                  <div>
                    <h3 className="text-sm sm:text-base font-medium text-gray-900 group-hover:text-stellanova transition-colors mb-1">
                      {entry.title}
                    </h3>
                    <p className="text-xs sm:text-sm text-gray-500 leading-relaxed mb-2 sm:mb-3 line-clamp-3">
                      {entry.summary}
                    </p>
                    <div className="flex gap-1 flex-wrap">
                      {entry.tags.map((tag) => (
                        <span
                          key={tag}
                          className="px-1.5 sm:px-2 py-0.5 rounded text-[10px] sm:text-[11px] bg-gray-50 text-gray-400"
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </main>

      <footer className="border-t border-gray-100 py-6 sm:py-8 mt-12 sm:mt-16">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 text-center">
          <p className="text-[11px] sm:text-xs text-gray-400">
            StellaNova Days — Brilliance for Someone Special
          </p>
        </div>
      </footer>
    </div>
  );
}