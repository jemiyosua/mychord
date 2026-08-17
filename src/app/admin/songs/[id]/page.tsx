"use client";

import { useEffect, useState, use } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { Song, Collection } from "@/lib/types";
import { transposeSong, isChordLine, isChord } from "@/lib/chords";

export default function SongEditorPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();

  const [song, setSong] = useState<Song | null>(null);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  // Form state
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [content, setContent] = useState("");
  const [originalKey, setOriginalKey] = useState("C");

  // Transpose state
  const [transpose, setTranspose] = useState(0);

  const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  function getAuthHeaders(): Record<string, string> {
    return {
      "Content-Type": "application/json",
      "X-Auth-Token": typeof window !== "undefined" ? (localStorage.getItem("auth_token") || "") : "",
      "X-User-Id": typeof window !== "undefined" ? (localStorage.getItem("auth_user_id") || "0") : "0",
    };
  }

  useEffect(() => {
    fetchSong();
  }, [id]);

  async function fetchSong() {
    try {
      const headers = getAuthHeaders();
      const res = await fetch(`/api/songs/${id}`, { headers });
      if (!res.ok) {
        setLoading(false);
        return;
      }
      const songData: Song = await res.json();
      setSong(songData);
      setTitle(songData.title);
      setArtist(songData.artist);
      setContent(songData.content);
      setOriginalKey(songData.originalKey);

      // Fetch collection info
      const colRes = await fetch(`/api/collections/${songData.collectionId}`, { headers });
      if (colRes.ok) {
        const colData = await colRes.json();
        setCollection(colData);
      }
    } catch {
      // ignore
    }
    setLoading(false);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMessage("");

    const res = await fetch(`/api/songs/${id}`, {
      method: "PUT",
      headers: getAuthHeaders(),
      body: JSON.stringify({ title, artist, content, originalKey }),
    });

    setSaving(false);
    if (res.ok) {
      setSaveMessage("Berhasil disimpan!");
      fetchSong();
      setTimeout(() => setSaveMessage(""), 3000);
    } else {
      setSaveMessage("Gagal menyimpan. Coba lagi.");
    }
  }

  // Transpose naik 1 semitone - mengubah chord di content langsung
  function handleTransposeUp() {
    const newContent = transposeSong(content, 1);
    setContent(newContent);
    setTranspose(transpose + 1);
    // Update key juga
    const idx = KEYS.indexOf(originalKey);
    if (idx !== -1) {
      const newIdx = (idx + 1) % 12;
      setOriginalKey(KEYS[newIdx]);
    }
  }

  // Transpose turun 1 semitone - mengubah chord di content langsung
  function handleTransposeDown() {
    const newContent = transposeSong(content, -1);
    setContent(newContent);
    setTranspose(transpose - 1);
    // Update key juga
    const idx = KEYS.indexOf(originalKey);
    if (idx !== -1) {
      const newIdx = ((idx - 1) + 12) % 12;
      setOriginalKey(KEYS[newIdx]);
    }
  }

  // Reset transpose ke original
  function handleTransposeReset() {
    if (song) {
      setContent(song.content);
      setOriginalKey(song.originalKey);
      setTranspose(0);
    }
  }

  // Render content dengan chord yang di-highlight
  function renderContent(text: string) {
    const lines = text.split("\n");
    return lines.map((line, lineIdx) => {
      // Check if this line has bracket chords
      const hasBrackets = /\[[^\]]+\]/.test(line);
      // Check if this line is a pure chord line (without brackets)
      const lineWithoutBrackets = line.replace(/\[[^\]]*\]/g, "").trim();
      const isPlainChordLine = !hasBrackets && lineWithoutBrackets && isChordLine(lineWithoutBrackets);

      if (isPlainChordLine) {
        // Render each chord token highlighted
        const tokens = line.split(/(\s+)/);
        return (
          <div key={lineIdx} className="min-h-[1.75rem]">
            {tokens.map((token, i) => {
              if (token.trim() && isChord(token.trim())) {
                return (
                  <span
                    key={i}
                    className="inline-block text-blue-700 font-bold bg-blue-100 px-1.5 py-0.5 rounded text-sm"
                  >
                    {token}
                  </span>
                );
              }
              return <span key={i}>{token}</span>;
            })}
          </div>
        );
      }

      // Render with bracket chord highlighting
      const parts = line.split(/(\[[^\]]+\])/g);
      return (
        <div key={lineIdx} className="min-h-[1.75rem]">
          {parts.map((part, i) => {
            if (part.startsWith("[") && part.endsWith("]")) {
              const chord = part.slice(1, -1);
              return (
                <span
                  key={i}
                  className="inline-block text-red-700 font-bold bg-red-100 px-1.5 py-0.5 rounded text-sm mx-0.5"
                >
                  {chord}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    });
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!song) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 text-lg">Lagu tidak ditemukan</p>
        <Link href="/admin" className="text-blue-600 hover:underline mt-2 inline-block">
          Kembali ke Collections
        </Link>
      </div>
    );
  }

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6 flex-wrap">
        <Link href="/admin" className="hover:text-blue-600 transition-colors">
          Collections
        </Link>
        <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        {collection && (
          <>
            <Link
              href={`/admin/collections/${collection.id}`}
              className="hover:text-blue-600 transition-colors"
            >
              {collection.name}
            </Link>
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </>
        )}
        <span className="text-gray-900 font-medium">{title || "Edit Lagu"}</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Edit Lagu</h1>
        {saveMessage && (
          <span className={`text-sm font-medium px-3 py-1.5 rounded-lg ${
            saveMessage.includes("Berhasil") 
              ? "bg-green-50 text-green-700 border border-green-200" 
              : "bg-red-50 text-red-700 border border-red-200"
          }`}>
            {saveMessage}
          </span>
        )}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Editor Form - Left Side */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Detail Lagu</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Judul Lagu
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Artis / Penyanyi
              </label>
              <input
                type="text"
                value={artist}
                onChange={(e) => setArtist(e.target.value)}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key / Nada Dasar
              </label>
              <select
                value={originalKey}
                onChange={(e) => setOriginalKey(e.target.value)}
                className="w-full md:w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                {KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>

            {/* Transpose Controls */}
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-semibold text-blue-800">Transpose Chord</span>
                <span className="text-xs text-blue-600">
                  {transpose !== 0 && `(${transpose > 0 ? "+" : ""}${transpose} semitone)`}
                </span>
              </div>
              <p className="text-xs text-blue-600 mb-3">
                Klik tombol di bawah untuk mengubah semua chord di lirik naik atau turun. Perubahan langsung diterapkan ke content.
              </p>
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTransposeDown}
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                  </svg>
                  Turun
                </button>
                <button
                  type="button"
                  onClick={handleTransposeUp}
                  className="inline-flex items-center gap-1.5 bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors text-sm"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  </svg>
                  Naik
                </button>
                {transpose !== 0 && (
                  <button
                    type="button"
                    onClick={handleTransposeReset}
                    className="inline-flex items-center gap-1.5 bg-white border border-gray-300 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-50 transition-colors text-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Reset
                  </button>
                )}
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lirik & Chord
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Tulis chord dalam tanda kurung siku:{" "}
                <code className="bg-gray-100 px-1 rounded">[Am]</code>Lirik{" "}
                <code className="bg-gray-100 px-1 rounded">[C]</code>di sini
              </p>
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                rows={14}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-y font-mono text-sm leading-6"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="submit"
                disabled={saving}
                className="inline-flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Menyimpan...
                  </>
                ) : (
                  <>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Simpan Perubahan
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={() => router.back()}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Kembali
              </button>
            </div>
          </form>
        </div>

        {/* Preview Panel - Right Side */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Preview Chord</h2>
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
                Key: <strong>{originalKey}</strong>
              </span>
              {transpose !== 0 && (
                <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  Original: {song.originalKey}
                </span>
              )}
            </div>
          </div>

          {/* Song Info in Preview */}
          <div className="mb-4 pb-3 border-b border-gray-200">
            <h3 className="text-xl font-bold text-gray-900">{title || "Judul Lagu"}</h3>
            {artist && <p className="text-gray-500 text-sm mt-1">{artist}</p>}
          </div>

          {/* Rendered Content with highlighted chords */}
          <div className="font-mono text-sm leading-7 text-gray-800 bg-gray-50 rounded-lg p-4 max-h-[600px] overflow-y-auto">
            {content ? (
              renderContent(content)
            ) : (
              <p className="text-gray-400 italic">Belum ada lirik dan chord...</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
