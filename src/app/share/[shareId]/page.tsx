"use client";

import { useEffect, useState, use } from "react";
import type { Collection, Song } from "@/lib/types";
import { isChordLine, isChord, transposeChord } from "@/lib/chords";

// Transpose semitones from Piano (concert pitch) to Alto Sax (Eb instrument)
// Alto Sax sounds a major 6th lower, so written note is 9 semitones higher
// Piano C = Alto Sax A (+9), Piano D = Alto Sax B (+9), etc.
const ALTO_SAX_SEMITONES = 9;

type Instrument = "piano" | "alto-sax";

function transposeChordForInstrument(chord: string, instrument: Instrument): string {
  if (instrument === "piano") return chord;
  return transposeChord(chord, ALTO_SAX_SEMITONES);
}

function SongView({ song, instrument }: { song: Song; instrument: Instrument }) {
  function renderContent(content: string) {
    const lines = content.split("\n");
    return lines.map((line, lineIdx) => {
      const hasBrackets = /\[[^\]]+\]/.test(line);
      const lineWithoutBrackets = line.replace(/\[[^\]]*\]/g, "").trim();
      const isPlainChordLine = !hasBrackets && lineWithoutBrackets && isChordLine(lineWithoutBrackets);

      if (isPlainChordLine) {
        const tokens = line.split(/(\s+)/);
        return (
          <div key={lineIdx} className="min-h-[1.75rem]">
            {tokens.map((token, i) => {
              if (token.trim() && isChord(token.trim())) {
                const displayed = transposeChordForInstrument(token.trim(), instrument);
                return (
                  <span key={i} className="inline-block text-blue-600 font-bold bg-blue-50 px-1 rounded text-sm">
                    {displayed}
                  </span>
                );
              }
              return <span key={i}>{token}</span>;
            })}
          </div>
        );
      }

      const parts = line.split(/(\[[^\]]+\])/g);
      return (
        <div key={lineIdx} className="min-h-[1.75rem]">
          {parts.map((part, i) => {
            if (part.startsWith("[") && part.endsWith("]")) {
              const chord = part.slice(1, -1);
              const displayed = transposeChordForInstrument(chord, instrument);
              return (
                <span key={i} className="inline-block text-red-700 font-bold bg-red-100 px-1 rounded text-sm">
                  {displayed}
                </span>
              );
            }
            return <span key={i}>{part}</span>;
          })}
        </div>
      );
    });
  }

  const displayKey = transposeChordForInstrument(song.originalKey, instrument);

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-gray-900">{song.title}</h2>
          {song.artist && <p className="text-gray-500 text-sm mt-1">{song.artist}</p>}
        </div>
        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
          Key: {displayKey}
        </span>
      </div>
      {song.referenceLink && (
        <div className="mb-4">
          <a
            href={song.referenceLink}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800 bg-blue-50 px-3 py-2 rounded-lg transition-colors"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Dengarkan Referensi
          </a>
        </div>
      )}
      <div className="font-mono text-sm leading-7 whitespace-pre-wrap text-gray-800 bg-gray-50 rounded-lg p-4">
        {renderContent(song.content)}
      </div>
    </div>
  );
}

export default function SharePage({ params }: { params: Promise<{ shareId: string }> }) {
  const { shareId } = use(params);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [activeIndex, setActiveIndex] = useState(0);
  const [instrument, setInstrument] = useState<Instrument>("piano");

  useEffect(() => {
    fetchData();
  }, [shareId]);

  async function fetchData() {
    try {
      const res = await fetch(`/api/share/${shareId}`);
      if (!res.ok) {
        setError(true);
        setLoading(false);
        return;
      }
      const data = await res.json();
      setCollection(data.collection);
      setSongs(data.songs);
    } catch {
      setError(true);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (error || !collection) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <h1 className="text-xl font-bold text-gray-900">Collection Tidak Ditemukan</h1>
          <p className="text-gray-500 mt-2">Link yang kamu akses mungkin salah atau sudah dihapus.</p>
        </div>
      </div>
    );
  }

  const activeSong = songs[activeIndex];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-blue-600 text-white shadow-lg">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-5">
          <div className="flex items-center gap-3 mb-1">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
            </svg>
            <span className="text-sm font-medium text-blue-200">MyChord</span>
          </div>
          <h1 className="text-xl font-bold">{collection.name}</h1>
          {collection.description && (
            <p className="text-blue-100 text-sm mt-1">{collection.description}</p>
          )}
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {songs.length === 0 ? (
          <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
            <p className="text-gray-500 text-lg">Belum ada lagu di collection ini</p>
          </div>
        ) : (
          <div className="flex flex-col md:flex-row gap-4">
            {/* Song List - Sidebar */}
            <div className="md:w-64 shrink-0">
              <div className="md:sticky md:top-4">
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">
                      Daftar Lagu ({songs.length})
                    </h3>
                  </div>
                  <div className="divide-y divide-gray-100 max-h-[50vh] overflow-y-auto">
                    {songs.map((song, idx) => (
                      <button
                        key={song.id}
                        onClick={() => setActiveIndex(idx)}
                        className={`w-full text-left px-4 py-3 transition-colors ${
                          idx === activeIndex
                            ? "bg-blue-50 border-l-4 border-blue-600"
                            : "hover:bg-gray-50 border-l-4 border-transparent"
                        }`}
                      >
                        <p className={`text-sm font-medium truncate ${
                          idx === activeIndex ? "text-blue-700" : "text-gray-900"
                        }`}>
                          {song.title}
                        </p>
                        {song.artist && (
                          <p className="text-xs text-gray-500 truncate mt-0.5">{song.artist}</p>
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Instrument Selector */}
                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden mt-4">
                  <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-sm font-semibold text-gray-700">Instrumen</h3>
                  </div>
                  <div className="p-3 space-y-2">
                    <button
                      onClick={() => setInstrument("piano")}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        instrument === "piano"
                          ? "bg-blue-50 border border-blue-200 text-blue-700"
                          : "hover:bg-gray-50 border border-transparent text-gray-700"
                      }`}
                    >
                      <span className="text-lg">🎹</span>
                      <div>
                        <p className={`text-sm font-medium ${instrument === "piano" ? "text-blue-700" : "text-gray-900"}`}>
                          Piano / Keyboard
                        </p>
                        <p className="text-xs text-gray-500">Concert pitch (nada normal)</p>
                      </div>
                    </button>
                    <button
                      onClick={() => setInstrument("alto-sax")}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        instrument === "alto-sax"
                          ? "bg-blue-50 border border-blue-200 text-blue-700"
                          : "hover:bg-gray-50 border border-transparent text-gray-700"
                      }`}
                    >
                      <span className="text-lg">🎷</span>
                      <div>
                        <p className={`text-sm font-medium ${instrument === "alto-sax" ? "text-blue-700" : "text-gray-900"}`}>
                          Alto Saxophone
                        </p>
                        <p className="text-xs text-gray-500">Transposisi Eb</p>
                      </div>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Active Song Content */}
            <div className="flex-1">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                {activeSong ? (
                  <SongView song={activeSong} instrument={instrument} />
                ) : (
                  <p className="text-gray-500">Pilih lagu dari daftar</p>
                )}
              </div>

              {/* Navigation buttons */}
              <div className="flex items-center justify-between mt-4">
                <button
                  onClick={() => setActiveIndex(Math.max(0, activeIndex - 1))}
                  disabled={activeIndex === 0}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  Sebelumnya
                </button>
                <span className="text-sm text-gray-500">
                  {activeIndex + 1} / {songs.length}
                </span>
                <button
                  onClick={() => setActiveIndex(Math.min(songs.length - 1, activeIndex + 1))}
                  disabled={activeIndex === songs.length - 1}
                  className="inline-flex items-center gap-1 px-4 py-2 text-sm font-medium rounded-lg bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Selanjutnya
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-3 mt-auto">
        <div className="max-w-5xl mx-auto px-4 text-center text-sm text-gray-500">
          Shared via MyChord &mdash; Chord Library Manager
        </div>
      </footer>
    </div>
  );
}
