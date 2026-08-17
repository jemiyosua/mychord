"use client";

import { useEffect, useState, use } from "react";
import Link from "next/link";
import type { Song } from "@/lib/types";
import { goGetSongs, goSaveSong, type SongResult } from "@/lib/go-api";

export default function CollectionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [formTitle, setFormTitle] = useState("");
  const [formArtist, setFormArtist] = useState("");
  const [formContent, setFormContent] = useState("");
  const [formKey, setFormKey] = useState("C");

  function getToken() {
    return localStorage.getItem("auth_token") || "";
  }

  function getUserId() {
    return parseInt(localStorage.getItem("auth_user_id") || "0", 10);
  }

  useEffect(() => {
    fetchData();
  }, [id]);

  async function fetchData() {
    try {
      const result = await goGetSongs({
        token: getToken(),
        user_id: getUserId(),
        page: 1,
        row_page: 100,
      });

      if (result.error_code === "0" && Array.isArray(result.result)) {
        const mapped: Song[] = (result.result as SongResult[]).map((song, idx) => ({
          id: String(song.id),
          collectionId: id,
          title: song.title,
          artist: song.artist,
          content: song.chord_content,
          originalKey: song.original_key,
          order: idx + 1,
          createdAt: song.tgl_input,
          updatedAt: song.tgl_update,
        }));
        setSongs(mapped);
      } else {
        setSongs([]);
      }
    } catch {
      setSongs([]);
    }
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();

    try {
      if (editingSong) {
        await goSaveSong({
          method: "UPDATE",
          token: getToken(),
          user_id: getUserId(),
          song_id: parseInt(editingSong.id, 10),
          title: formTitle,
          artist: formArtist,
          chord_content: formContent,
          original_key: formKey,
        });
      } else {
        await goSaveSong({
          method: "INSERT",
          token: getToken(),
          user_id: getUserId(),
          title: formTitle,
          artist: formArtist,
          chord_content: formContent,
          original_key: formKey,
        });
      }
    } catch {
      // ignore
    }

    resetForm();
    fetchData();
  }

  async function handleDelete(songId: string) {
    if (!confirm("Apakah kamu yakin ingin menghapus lagu ini?")) return;

    try {
      await goSaveSong({
        method: "DELETE",
        token: getToken(),
        user_id: getUserId(),
        song_id: parseInt(songId, 10),
        title: "deleted",
        chord_content: "deleted",
      });
    } catch {
      // ignore
    }
    fetchData();
  }

  function handleEdit(song: Song) {
    setEditingSong(song);
    setFormTitle(song.title);
    setFormArtist(song.artist);
    setFormContent(song.content);
    setFormKey(song.originalKey);
    setShowForm(true);
  }

  function resetForm() {
    setShowForm(false);
    setEditingSong(null);
    setFormTitle("");
    setFormArtist("");
    setFormContent("");
    setFormKey("C");
  }

  function handleMoveUp(idx: number) {
    if (idx === 0) return;
    const newSongs = [...songs];
    [newSongs[idx - 1], newSongs[idx]] = [newSongs[idx], newSongs[idx - 1]];
    setSongs(newSongs);
  }

  function handleMoveDown(idx: number) {
    if (idx === songs.length - 1) return;
    const newSongs = [...songs];
    [newSongs[idx], newSongs[idx + 1]] = [newSongs[idx + 1], newSongs[idx]];
    setSongs(newSongs);
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const KEYS = ["C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B"];

  return (
    <div>
      {/* Breadcrumb */}
      <nav className="flex items-center gap-2 text-sm text-gray-500 mb-6">
        <Link href="/admin" className="hover:text-blue-600 transition-colors">
          Collections
        </Link>
        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
        </svg>
        <span className="text-gray-900 font-medium">My Songs</span>
      </nav>

      {/* Page Header */}
      <div className="flex items-start justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Songs</h1>
          <p className="text-gray-600 mt-1">Kelola lagu dan chord kamu</p>
        </div>
        <button
          onClick={() => setShowForm(true)}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-4 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors shadow-sm"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Tambah Lagu
        </button>
      </div>

      {/* Song Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            {editingSong ? "Edit Lagu" : "Tambah Lagu Baru"}
          </h2>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Judul Lagu
                </label>
                <input
                  type="text"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  placeholder="contoh: Amazing Grace"
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
                  value={formArtist}
                  onChange={(e) => setFormArtist(e.target.value)}
                  placeholder="contoh: John Newton"
                  className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Key / Nada Dasar
              </label>
              <select
                value={formKey}
                onChange={(e) => setFormKey(e.target.value)}
                className="w-full md:w-48 px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors"
              >
                {KEYS.map((key) => (
                  <option key={key} value={key}>
                    {key}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Lirik & Chord
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Tulis chord dalam tanda kurung siku, contoh: [Am]Lirik lagu [C]di sini [G]seperti ini
              </p>
              <textarea
                value={formContent}
                onChange={(e) => setFormContent(e.target.value)}
                placeholder={`[C]Amazing grace how [F]sweet the sound\n[C]That saved a [G]wretch like me\n[C]I once was [F]lost but [C]now am found\n[Am]Was blind but [G]now I [C]see`}
                rows={10}
                className="w-full px-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-colors resize-y font-mono text-sm"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                className="bg-blue-600 text-white px-5 py-2.5 rounded-lg font-medium hover:bg-blue-700 transition-colors"
              >
                {editingSong ? "Simpan Perubahan" : "Tambah Lagu"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="bg-gray-100 text-gray-700 px-5 py-2.5 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Batal
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Songs List */}
      {songs.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-xl border border-gray-200">
          <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19V6l12-3v13M9 19c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zm12-3c0 1.105-1.343 2-3 2s-3-.895-3-2 1.343-2 3-2 3 .895 3 2zM9 10l12-3" />
          </svg>
          <p className="text-gray-500 text-lg">Belum ada lagu</p>
          <p className="text-gray-400 mt-1">Tambah lagu pertamamu</p>
        </div>
      ) : (
        <div className="space-y-3">
          {songs.map((song, idx) => (
            <div
              key={song.id}
              className="bg-white rounded-xl shadow-sm border border-gray-200 p-5 hover:shadow-md transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* Order number & move buttons */}
                <div className="flex flex-col items-center gap-1 pt-1">
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Pindah ke atas"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <span className="text-sm font-bold text-gray-400 w-6 text-center">{idx + 1}</span>
                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === songs.length - 1}
                    className="p-1 text-gray-400 hover:text-blue-600 rounded hover:bg-blue-50 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                    title="Pindah ke bawah"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </button>
                </div>

                {/* Song content */}
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold text-gray-900">{song.title}</h3>
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      Key: {song.originalKey}
                    </span>
                  </div>
                  {song.artist && (
                    <p className="text-gray-500 text-sm mt-1">{song.artist}</p>
                  )}
                  <div className="mt-3 bg-gray-50 rounded-lg p-3 font-mono text-sm text-gray-700 whitespace-pre-wrap line-clamp-3">
                    {song.content.slice(0, 150)}
                    {song.content.length > 150 && "..."}
                  </div>
                </div>

                {/* Action buttons */}
                <div className="flex items-center gap-1 ml-2">
                  <a
                    href={`/admin/songs/${song.id}`}
                    className="p-2 text-gray-400 hover:text-green-600 rounded-md hover:bg-green-50 transition-colors"
                    title="Edit di halaman editor"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                  </a>
                  <button
                    onClick={() => handleEdit(song)}
                    className="p-2 text-gray-400 hover:text-blue-600 rounded-md hover:bg-blue-50 transition-colors"
                    title="Quick Edit"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(song.id)}
                    className="p-2 text-gray-400 hover:text-red-600 rounded-md hover:bg-red-50 transition-colors"
                    title="Hapus"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
