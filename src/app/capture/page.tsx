"use client";

import { useState, useRef, useEffect } from "react";
import { ArrowLeft, Sparkles, Check, Loader2, MessageCircle, FileText, Lock, ImageIcon, X } from "lucide-react";
import Link from "next/link";

const ACCESS_PASSWORD = process.env.NEXT_PUBLIC_ACCESS_PASSWORD;

export default function CapturePage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState(false);
  const [tab, setTab] = useState<"chat" | "meeting">("chat");

  // Chat state
  const [chatText, setChatText] = useState("");
  const [processing, setProcessing] = useState(false);
  const [results, setResults] = useState<
    { date: string; title: string; tags: string[]; count: number }[]
  >([]);

  // Meeting state
  const [meetingDate, setMeetingDate] = useState(
    new Date().toISOString().slice(0, 10)
  );
  const [meetingTitle, setMeetingTitle] = useState("");
  const [meetingNotes, setMeetingNotes] = useState("");
  const [meetingResult, setMeetingResult] = useState<{
    success: boolean;
    date: string;
    title: string;
  } | null>(null);

  // Image URLs (shared between tabs)
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [imageInput, setImageInput] = useState("");

  const addImageUrl = () => {
    const url = imageInput.trim();
    if (url && !imageUrls.includes(url)) {
      setImageUrls([...imageUrls, url]);
    }
    setImageInput("");
  };

  const removeImageUrl = (url: string) => {
    setImageUrls(imageUrls.filter((u) => u !== url));
  };

  const chatRef = useRef<HTMLTextAreaElement>(null);

  // Password gate: check sessionStorage on mount
  useEffect(() => {
    if (!ACCESS_PASSWORD) {
      setAuthenticated(true);
    } else if (sessionStorage.getItem("sd_auth") === "1") {
      setAuthenticated(true);
    }
  }, []);

  const submitPassword = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ACCESS_PASSWORD) {
      sessionStorage.setItem("sd_auth", "1");
      setAuthenticated(true);
      setPasswordError(false);
    } else {
      setPasswordError(true);
    }
  };

  const processChat = async () => {
    if (!chatText.trim()) return;
    setProcessing(true);
    setResults([]);

    try {
      const res = await fetch("/api/capture", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: chatText, images: imageUrls }),
      });
      const data = await res.json();
      setResults(data.results || []);
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  const saveMeeting = async () => {
    if (!meetingNotes.trim() || !meetingTitle.trim()) return;
    setProcessing(true);
    setMeetingResult(null);

    try {
      const res = await fetch("/api/capture/meeting", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: meetingDate,
          title: meetingTitle,
          notes: meetingNotes,
          images: imageUrls,
        }),
      });
      const data = await res.json();
      setMeetingResult({ success: true, date: data.date, title: data.title });
      // Clear form
      setMeetingNotes("");
      setMeetingTitle("");
    } catch (e) {
      console.error(e);
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      <div className="bg-stellanova text-white text-center py-1.5 text-[11px] sm:text-xs tracking-wide px-4">
        {tab === "chat"
          ? "카카오톡 대화를 붙여넣고, 하루 단위로 기록하세요"
          : "회의록을 날짜별로 저장하세요"}
      </div>

      <header className="border-b border-gray-100 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 py-4 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 text-gray-500 hover:text-gray-900 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span className="text-sm">대시보드</span>
          </Link>
          <h1 className="text-sm font-medium text-gray-900">기록 캡처</h1>
          <div className="w-16" />
        </div>
      </header>

      {!authenticated ? (
        <main className="max-w-md mx-auto px-4 py-20 text-center">
          <div className="bg-gray-50 rounded-2xl p-8">
            <Lock className="w-10 h-10 text-stellanova mx-auto mb-4" />
            <h2 className="text-lg font-medium text-gray-900 mb-2">
              비밀번호를 입력하세요
            </h2>
            <p className="text-sm text-gray-500 mb-6">
              기록 캡처 페이지는 비밀번호로 보호되어 있습니다
            </p>
            <form onSubmit={submitPassword}>
              <input
                type="password"
                value={password}
                onChange={(e) => { setPassword(e.target.value); setPasswordError(false); }}
                placeholder="비밀번호"
                autoFocus
                className={`w-full px-4 py-2.5 text-sm border rounded-xl text-center focus:outline-none focus:ring-2 ${
                  passwordError
                    ? "border-red-300 focus:ring-red-100"
                    : "border-gray-200 focus:border-stellanova/30 focus:ring-stellanova/10"
                }`}
              />
              {passwordError && (
                <p className="text-red-500 text-xs mt-2">비밀번호가 올바르지 않습니다</p>
              )}
              <button
                type="submit"
                className="mt-4 w-full bg-stellanova text-white rounded-xl py-2.5 text-sm font-medium hover:bg-stellanova/90 transition-colors"
              >
                확인
              </button>
            </form>
          </div>
        </main>
      ) : (
      <main className="max-w-2xl mx-auto px-4 sm:px-6 py-8">
        {/* Tab switcher */}
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 mb-6">
          <button
            onClick={() => setTab("chat")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "chat"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <MessageCircle className="w-4 h-4" />
            카카오톡 대화
          </button>
          <button
            onClick={() => setTab("meeting")}
            className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-lg text-sm font-medium transition-colors ${
              tab === "meeting"
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            <FileText className="w-4 h-4" />
            회의록
          </button>
        </div>

        {/* ========== CHAT TAB ========== */}
        {tab === "chat" && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                카카오톡 대화 붙여넣기
              </h2>
              <p className="text-sm text-gray-500">
                카카오톡 채팅방에서 대화를 복사(Cmd+A → Cmd+C)한 뒤
                아래에 붙여넣고 &apos;처리하기&apos;를 눌러주세요.
                날짜별로 자동 구분되어 저장됩니다.
              </p>
            </div>

            <textarea
              ref={chatRef}
              value={chatText}
              onChange={(e) => setChatText(e.target.value)}
              placeholder={`예시:
2026년 7월 5일 오전 9:15, 이연희 상무: 오늘 발렉스에서 연락왔어요.
2026년 7월 5일 오전 9:16, 형: 네 확인했습니다!
2026년 7월 4일 오후 4:30, 형: 시드니 링 추가 주문 가능할까요?`}
              className="w-full h-64 p-4 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-stellanova/30 focus:ring-2 focus:ring-stellanova/10 font-mono leading-relaxed"
            />

            {/* Image URLs */}
            <div className="mt-4">
              <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                사진 URL (선택)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-stellanova/30 focus:ring-2 focus:ring-stellanova/10"
                />
                <button
                  onClick={addImageUrl}
                  disabled={!imageInput.trim()}
                  className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-40 transition-colors"
                >
                  추가
                </button>
              </div>
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {imageUrls.map((url) => (
                    <span key={url} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-[11px] text-gray-600">
                      <span className="max-w-[120px] truncate">{url.split("/").pop()}</span>
                      <button onClick={() => removeImageUrl(url)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={processChat}
              disabled={processing || !chatText.trim()}
              className="mt-4 w-full flex items-center justify-center gap-2 bg-stellanova text-white rounded-xl py-3 text-sm font-medium hover:bg-stellanova/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  처리 중...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  날짜별로 저장하기
                </>
              )}
            </button>

            {results.length > 0 && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  {results.length}건의 일지가 저장되었습니다
                </h3>
                <div className="space-y-2">
                  {results.map((r) => (
                    <div
                      key={r.date}
                      className="flex items-center justify-between bg-gray-50 rounded-lg px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-medium text-gray-900">
                          {r.title}
                        </p>
                        <p className="text-xs text-gray-500 mt-0.5">
                          {r.date} · {r.count}개 메시지
                        </p>
                      </div>
                      <div className="flex gap-1">
                        {r.tags.slice(0, 3).map((t) => (
                          <span
                            key={t}
                            className="px-1.5 py-0.5 rounded text-[10px] bg-stellanova/10 text-stellanova"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-stellanova hover:underline"
                >
                  대시보드에서 확인하기 →
                </Link>
              </div>
            )}
          </>
        )}

        {/* ========== MEETING TAB ========== */}
        {tab === "meeting" && (
          <>
            <div className="mb-6">
              <h2 className="text-lg font-medium text-gray-900 mb-2">
                회의록 저장
              </h2>
              <p className="text-sm text-gray-500">
                회의 날짜와 제목을 입력하고, 회의 내용을 붙여넣으세요.
              </p>
            </div>

            {/* Date picker */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">
                회의 날짜
              </label>
              <input
                type="date"
                value={meetingDate}
                onChange={(e) => setMeetingDate(e.target.value)}
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-stellanova/30 focus:ring-2 focus:ring-stellanova/10"
              />
            </div>

            {/* Title */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">
                회의 제목
              </label>
              <input
                type="text"
                value={meetingTitle}
                onChange={(e) => setMeetingTitle(e.target.value)}
                placeholder="예: 주간 제품 전략 회의"
                className="w-full px-4 py-2.5 text-sm border border-gray-200 rounded-xl focus:outline-none focus:border-stellanova/30 focus:ring-2 focus:ring-stellanova/10"
              />
            </div>

            {/* Meeting notes */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5">
                회의 내용
              </label>
              <textarea
                value={meetingNotes}
                onChange={(e) => setMeetingNotes(e.target.value)}
                placeholder={`예시:
## 참석자
- 이연희 상무
- 형

## 논의 사항
1. 시드니 라인 3캐럿 추가 검토
2. 목걸이 라인 확장 계획

## 결정 사항
- 7월 중 시드니 3캐럿 출시
- 목걸이 2종 추가 디자인 의뢰`}
                className="w-full h-64 p-4 text-sm border border-gray-200 rounded-xl resize-none focus:outline-none focus:border-stellanova/30 focus:ring-2 focus:ring-stellanova/10 leading-relaxed"
              />
            </div>

            {/* Image URLs */}
            <div className="mb-4">
              <label className="block text-xs text-gray-500 mb-1.5 flex items-center gap-1">
                <ImageIcon className="w-3 h-3" />
                사진 URL (선택)
              </label>
              <div className="flex gap-2">
                <input
                  type="url"
                  value={imageInput}
                  onChange={(e) => setImageInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addImageUrl())}
                  placeholder="https://example.com/photo.jpg"
                  className="flex-1 px-3 py-2 text-xs border border-gray-200 rounded-xl focus:outline-none focus:border-stellanova/30 focus:ring-2 focus:ring-stellanova/10"
                />
                <button
                  onClick={addImageUrl}
                  disabled={!imageInput.trim()}
                  className="px-3 py-2 text-xs bg-gray-100 text-gray-600 rounded-xl hover:bg-gray-200 disabled:opacity-40 transition-colors"
                >
                  추가
                </button>
              </div>
              {imageUrls.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {imageUrls.map((url) => (
                    <span key={url} className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 rounded-lg text-[11px] text-gray-600">
                      <span className="max-w-[120px] truncate">{url.split("/").pop()}</span>
                      <button onClick={() => removeImageUrl(url)} className="text-gray-400 hover:text-red-500"><X className="w-3 h-3" /></button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={saveMeeting}
              disabled={
                processing || !meetingNotes.trim() || !meetingTitle.trim()
              }
              className="w-full flex items-center justify-center gap-2 bg-stellanova text-white rounded-xl py-3 text-sm font-medium hover:bg-stellanova/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {processing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  저장 중...
                </>
              ) : (
                <>
                  <FileText className="w-4 h-4" />
                  회의록 저장하기
                </>
              )}
            </button>

            {meetingResult?.success && (
              <div className="mt-8">
                <h3 className="text-sm font-medium text-gray-900 mb-3 flex items-center gap-2">
                  <Check className="w-4 h-4 text-green-500" />
                  회의록이 저장되었습니다
                </h3>
                <div className="bg-gray-50 rounded-lg px-4 py-3">
                  <p className="text-sm font-medium text-gray-900">
                    {meetingResult.title}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">
                    {meetingResult.date}
                  </p>
                </div>
                <Link
                  href="/"
                  className="mt-4 inline-flex items-center gap-1 text-sm text-stellanova hover:underline"
                >
                  대시보드에서 확인하기 →
                </Link>
              </div>
            )}
          </>
        )}
      </main>
      )}
    </div>
  );
}