"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, MessageCircle, FileText, Calendar, Tag } from "lucide-react";

interface Entry {
  id: number;
  date: string;
  title: string;
  summary: string;
  tags: string[];
  raw_content?: string;
  meeting_notes?: string;
}

export default function DayPage() {
  const params = useParams<{ date: string }>();
  const [entry, setEntry] = useState<Entry | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"summary" | "chat" | "meeting">(
    "summary"
  );

  useEffect(() => {
    fetch(`/api/entries/${params.date}`)
      .then((res) => res.json())
      .then((data: Entry) => {
        setEntry(data);
        setLoading(false);
        // Auto-select tab with content
        if (data.meeting_notes) setActiveTab("meeting");
        else if (data.raw_content) setActiveTab("chat");
      })
      .catch(() => setLoading(false));
  }, [params.date]);

  if (loading) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="w-5 h-5 border-2 border-stellanova/30 border-t-stellanova rounded-full animate-spin" />
      </div>
    );
  }

  if (!entry) {
    return (
      <div className="min-h-screen bg-white flex flex-col items-center justify-center gap-4">
        <p className="text-gray-500">기록을 찾을 수 없습니다</p>
        <Link href="/" className="text-sm text-stellanova hover:underline">
          대시보드로 돌아가기
        </Link>
      </div>
    );
  }

  const d = new Date(entry.date);

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">대시보드</span>
          </Link>
          <div className="w-16" />
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Date & Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-sm text-gray-400 mb-2">
            <Calendar className="w-4 h-4" />
            {d.toLocaleDateString("ko-KR", {
              year: "numeric",
              month: "long",
              day: "numeric",
              weekday: "long",
            })}
          </div>
          <h1 className="text-xl sm:text-2xl font-medium text-gray-900 mb-3">
            {entry.title}
          </h1>
          <div className="flex gap-1.5 flex-wrap">
            {entry.tags.map((tag) => (
              <span
                key={tag}
                className="px-2 py-0.5 rounded text-[11px] bg-stellanova/10 text-stellanova"
              >
                #{tag}
              </span>
            ))}
          </div>
        </div>

        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setActiveTab("summary")}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "summary"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            ✨ 요약
          </button>
          <button
            onClick={() => setActiveTab("chat")}
            disabled={!entry.raw_content}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "chat"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <MessageCircle className="w-3.5 h-3.5" />
            카카오톡
          </button>
          <button
            onClick={() => setActiveTab("meeting")}
            disabled={!entry.meeting_notes}
            className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg text-xs sm:text-sm font-medium transition-colors ${
              activeTab === "meeting"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            } disabled:opacity-40 disabled:cursor-not-allowed`}
          >
            <FileText className="w-3.5 h-3.5" />
            회의록
          </button>
        </div>

        {/* Content */}
        <div className="bg-gray-50 rounded-xl p-5 sm:p-6">
          {/* Summary Tab */}
          {activeTab === "summary" && (
            <div className="prose prose-sm max-w-none">
              <h2 className="text-base font-medium text-gray-900 mb-3">
                🤖 AI 요약
              </h2>
              <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
                {entry.summary}
              </div>
            </div>
          )}

          {/* Chat Tab */}
          {activeTab === "chat" && entry.raw_content && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                <MessageCircle className="w-4 h-4 text-yellow-500" />
                카카오톡 대화 원본
              </h2>
              <div className="bg-white rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap font-mono text-gray-700 border border-gray-100">
                {entry.raw_content}
              </div>
            </div>
          )}

          {/* Meeting Tab */}
          {activeTab === "meeting" && entry.meeting_notes && (
            <div>
              <h2 className="text-base font-medium text-gray-900 mb-3 flex items-center gap-2">
                <FileText className="w-4 h-4 text-blue-500" />
                회의록
              </h2>
              <div className="bg-white rounded-lg p-4 text-sm leading-relaxed whitespace-pre-wrap text-gray-700 border border-gray-100">
                {entry.meeting_notes}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}