'use client';

import { FormEvent, useEffect, useMemo, useState, ChangeEvent } from 'react';
import { FileText, Newspaper, Pencil, Plus, Sparkles, Trash2, ExternalLink, X, Upload } from 'lucide-react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { apiRequest } from '@/lib/api';

const CKEditorWrapper = dynamic(() => import('@/components/CKEditorWrapper'), { ssr: false });

type BlogStatus = 'PUBLISHED' | 'DRAFT' | 'ARCHIVED';

type BlogPost = {
  id: string;
  title: string;
  thumbnail: string;
  slug: string;
  category: string;
  content: string;
  status: BlogStatus;
  author_name: string;
  created_at: string;
  updated_at: string;
  published_at?: string;
};

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [title, setTitle] = useState('');
  const [thumbnail, setThumbnail] = useState('');
  const [category, setCategory] = useState('Pertanian');
  const [authorName, setAuthorName] = useState('Admin Electra');
  const [status, setStatus] = useState<BlogStatus>('DRAFT');
  const [content, setContent] = useState('');
  const [editingPostId, setEditingPostId] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const res = await apiRequest<BlogPost[]>('/api/admin/blogs');
      if (res.ok && res.data) {
        setPosts(res.data);
      }
    } catch (err: any) {
      console.error(err);
      setMessage(err.message || 'Gagal memuat berita.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const stats = useMemo(() => [
    { label: 'Total Artikel', value: posts.length, color: 'text-cyan-400' },
    { label: 'Terbit', value: posts.filter((post) => post.status === 'PUBLISHED').length, color: 'text-emerald-400' },
    { label: 'Draft', value: posts.filter((post) => post.status === 'DRAFT').length, color: 'text-amber-400' },
  ], [posts]);

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingPostId(null);
    setTitle('');
    setThumbnail('');
    setCategory('Pertanian');
    setAuthorName('Admin Electra');
    setStatus('DRAFT');
    setContent('');
  };

  const openAddModal = () => {
    closeModal();
    setIsModalOpen(true);
  };

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploadingImage(true);
      const formData = new FormData();
      formData.append('image', file);

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/upload`, {
        method: 'POST',
        body: formData,
      });

      const json = await res.json();
      if (json.ok && json.url) {
        setThumbnail(json.url);
      } else {
        alert(json.message || 'Gagal mengunggah gambar.');
      }
    } catch (err: any) {
      alert('Gagal mengunggah file gambar.');
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!title.trim() || !thumbnail.trim() || !content.trim()) {
      setMessage('Judul, gambar thumbnail, dan konten berita wajib diisi.');
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingPostId) {
        const res = await apiRequest<BlogPost>(`/api/admin/blogs/${editingPostId}`, {
          method: 'PUT',
          body: JSON.stringify({
            title: title.trim(),
            thumbnail: thumbnail.trim(),
            category: category.trim(),
            content,
            status,
            author_name: authorName.trim(),
          }),
        });
        if (res.ok) {
          setMessage('Berita berhasil diperbarui.');
          fetchPosts();
          closeModal();
        }
      } else {
        const res = await apiRequest<BlogPost>('/api/admin/blogs', {
          method: 'POST',
          body: JSON.stringify({
            title: title.trim(),
            thumbnail: thumbnail.trim(),
            category: category.trim(),
            content,
            status,
            author_name: authorName.trim(),
          }),
        });
        if (res.ok) {
          setMessage('Berita baru berhasil diterbitkan/disimpan.');
          fetchPosts();
          closeModal();
        }
      }
    } catch (err: any) {
      setMessage(err.message || 'Terjadi kesalahan saat menyimpan berita.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const startEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setThumbnail(post.thumbnail || '');
    setCategory(post.category);
    setAuthorName(post.author_name || 'Admin Electra');
    setStatus(post.status);
    setContent(post.content);
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string, postTitle: string) => {
    if (!confirm(`Apakah Anda yakin ingin menghapus berita "${postTitle}"?`)) return;

    try {
      const res = await apiRequest(`/api/admin/blogs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setMessage('Berita berhasil dihapus.');
        fetchPosts();
      }
    } catch (err: any) {
      setMessage(err.message || 'Gagal menghapus berita.');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight text-white">
            Manajemen Berita & Blog
          </h1>
          <p className="mt-1 text-sm text-slate-400">Kelola artikel, berita, dan blog resmi Electra Tech dengan CKEditor & Upload File Gambar.</p>
        </div>
        <button
          onClick={openAddModal}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-medium text-white transition hover:bg-cyan-500"
        >
          <Plus className="h-4 w-4" />
          Tambah Blog / Berita
        </button>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          return (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <p className="mt-4 text-3xl font-semibold text-white">{stat.value}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      {message && <p className="text-sm font-medium text-green-300 bg-slate-900 border border-slate-800 p-3 rounded-xl">{message}</p>}

      {/* Modal Form Tambah / Edit Blog */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/80 p-4 backdrop-blur-sm overflow-y-auto">
          <div className="w-full max-w-3xl my-8 rounded-2xl border border-slate-800 bg-slate-900 p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-800 pb-3">
              <h2 className="text-lg font-semibold text-white flex items-center gap-2">
                {editingPostId ? <Pencil className="h-5 w-5 text-cyan-400" /> : <Plus className="h-5 w-5 text-cyan-400" />}
                {editingPostId ? 'Edit Artikel / Berita' : 'Tambah Artikel / Berita Baru'}
              </h2>
              <button onClick={closeModal} className="text-slate-400 hover:text-white transition">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Judul Berita</label>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Contoh: Strategi Efisien Menjaga Kualitas Benih"
                    required
                  />
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Upload Gambar Thumbnail</label>
                  <div className="flex items-center gap-2">
                    <label className="flex-1 cursor-pointer flex items-center gap-2 justify-center rounded-xl border border-dashed border-slate-700 bg-slate-950 px-3.5 py-2.5 text-xs text-slate-300 hover:border-cyan-500 transition">
                      <Upload className="h-4 w-4 text-cyan-400" />
                      <span>{isUploadingImage ? 'Mengunggah...' : 'Pilih File Gambar'}</span>
                      <input type="file" accept="image/*" onChange={handleFileUpload} className="hidden" />
                    </label>
                  </div>
                  {thumbnail && (
                    <div className="mt-2 relative h-20 w-36 rounded-lg overflow-hidden border border-slate-800">
                      <Image src={thumbnail} alt="Thumbnail preview" fill unoptimized className="object-cover" />
                    </div>
                  )}
                </div>

                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-400">Kategori</label>
                  <input
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    placeholder="Pertanian, IoT, Blockchain, dll."
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Penulis (Author)</label>
                    <input
                      value={authorName}
                      onChange={(e) => setAuthorName(e.target.value)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                      placeholder="Admin Electra"
                      required
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-400">Status</label>
                    <select
                      value={status}
                      onChange={(e) => setStatus(e.target.value as BlogStatus)}
                      className="w-full rounded-xl border border-slate-800 bg-slate-950 px-3.5 py-2.5 text-sm text-white outline-none focus:border-cyan-500"
                    >
                      <option value="DRAFT">Draft</option>
                      <option value="PUBLISHED">Terbit (Published)</option>
                      <option value="ARCHIVED">Arsip</option>
                    </select>
                  </div>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-medium text-slate-400">Isi Konten (CKEditor Rich Text & Image Upload)</label>
                <CKEditorWrapper value={content} onChange={(data) => setContent(data)} />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingImage}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500 disabled:opacity-50"
                >
                  {editingPostId ? 'Simpan Perubahan' : 'Tambah Artikel'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <h3 className="mb-4 text-base font-bold text-white">Daftar Artikel & Berita</h3>
        {loading ? (
          <p className="text-sm text-slate-400">Memuat artikel...</p>
        ) : posts.length === 0 ? (
          <p className="text-sm text-slate-400">Belum ada artikel berita.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead>
                <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                  <th className="pb-3">Thumbnail</th>
                  <th className="pb-3">Judul & Slug</th>
                  <th className="pb-3">Kategori</th>
                  <th className="pb-3">Penulis</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-800/20">
                    <td className="py-4 pr-3">
                      <div className="relative h-12 w-20 rounded-lg overflow-hidden border border-slate-800 bg-slate-950">
                        {post.thumbnail ? (
                          <Image src={post.thumbnail} alt={post.title} fill unoptimized className="object-cover" />
                        ) : (
                          <div className="flex h-full w-full items-center justify-center text-[10px] text-slate-500">No Image</div>
                        )}
                      </div>
                    </td>
                    <td className="py-4 max-w-xs">
                      <p className="font-semibold text-slate-100 truncate">{post.title}</p>
                      <p className="mt-0.5 text-xs font-mono text-cyan-400/80 truncate">/blog/{post.slug}</p>
                    </td>
                    <td className="py-4 text-slate-300">{post.category}</td>
                    <td className="py-4 text-slate-300">{post.author_name}</td>
                    <td className="py-4">
                      <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${
                        post.status === 'PUBLISHED'
                          ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
                          : post.status === 'DRAFT'
                          ? 'border-amber-500/20 bg-amber-500/10 text-amber-300'
                          : 'border-slate-500/20 bg-slate-500/10 text-slate-400'
                      }`}>
                        {post.status}
                      </span>
                    </td>
                    <td className="py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {post.status === 'PUBLISHED' && (
                          <a
                            href={`/blog/${post.slug}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-slate-300 transition hover:bg-slate-800"
                          >
                            <ExternalLink className="h-3 w-3" />
                            Lihat
                          </a>
                        )}
                        <button
                          onClick={() => startEdit(post)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-slate-800"
                        >
                          <Pencil className="h-3 w-3" />
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(post.id, post.title)}
                          className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-2.5 py-1.5 text-xs font-bold text-red-400 transition hover:bg-red-950/40"
                        >
                          <Trash2 className="h-3 w-3" />
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
