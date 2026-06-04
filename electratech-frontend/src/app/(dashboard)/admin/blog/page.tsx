'use client';

import { FormEvent, useMemo, useState } from 'react';
import { FileText, Newspaper, Pencil, Plus, Sparkles } from 'lucide-react';

type BlogStatus = 'PUBLISHED' | 'DRAFT';

type BlogPost = {
  id: string;
  title: string;
  category: string;
  author: string;
  status: BlogStatus;
  publishedAt: string;
  excerpt: string;
};

const initialPosts: BlogPost[] = [
  {
    id: 'BLG-001',
    title: 'Strategi efisien menjaga kualitas benih di musim hujan',
    category: 'Pertanian',
    author: 'Admin Electra',
    status: 'PUBLISHED',
    publishedAt: '02 Jun 2026',
    excerpt: 'Tips praktik harian untuk menjaga kualitas benih, pengendalian kelembapan, dan efisiensi logistik.',
  },
  {
    id: 'BLG-002',
    title: 'Mengapa transparansi data penting dalam rantai pasok pertanian',
    category: 'Teknologi',
    author: 'Tim Produk',
    status: 'DRAFT',
    publishedAt: 'Belum dipublikasikan',
    excerpt: 'Rangkuman fitur pelacakan, audit, dan dashboard yang membantu tim produksi memantau kegiatan.',
  },
];

export default function AdminBlogPage() {
  const [posts, setPosts] = useState<BlogPost[]>(initialPosts);
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Pertanian');
  const [author, setAuthor] = useState('Admin Electra');
  const [status, setStatus] = useState<BlogStatus>('DRAFT');
  const [excerpt, setExcerpt] = useState('');
  const [editingPostId, setEditingPostId] = useState('');
  const [message, setMessage] = useState('');

  const stats = useMemo(() => [
    { label: 'Total Pos', value: posts.length, icon: Newspaper, color: 'text-cyan-400' },
    { label: 'Terbit', value: posts.filter((post) => post.status === 'PUBLISHED').length, icon: Sparkles, color: 'text-emerald-400' },
    { label: 'Draft', value: posts.filter((post) => post.status === 'DRAFT').length, icon: FileText, color: 'text-amber-400' },
  ], [posts]);

  const resetForm = () => {
    setEditingPostId('');
    setTitle('');
    setCategory('Pertanian');
    setAuthor('Admin Electra');
    setStatus('DRAFT');
    setExcerpt('');
  };

  const handleCreatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!title.trim() || !excerpt.trim()) {
      setMessage('Judul dan ringkasan artikel wajib diisi.');
      return;
    }

    const newPost: BlogPost = {
      id: `BLG-${String(posts.length + 1).padStart(3, '0')}`,
      title: title.trim(),
      category: category.trim() || 'Umum',
      author: author.trim() || 'Admin Electra',
      status,
      publishedAt: status === 'PUBLISHED' ? 'Baru dipublikasikan' : 'Disimpan sebagai draft',
      excerpt: excerpt.trim(),
    };

    setPosts((current) => [newPost, ...current]);
    resetForm();
    setMessage('Artikel baru berhasil ditambahkan.');
  };

  const startEdit = (post: BlogPost) => {
    setEditingPostId(post.id);
    setTitle(post.title);
    setCategory(post.category);
    setAuthor(post.author);
    setStatus(post.status);
    setExcerpt(post.excerpt);
    setMessage(`Mode edit aktif untuk ${post.title}.`);
  };

  const handleUpdatePost = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMessage('');

    if (!editingPostId) return;

    setPosts((current) =>
      current.map((post) =>
        post.id === editingPostId
          ? {
              ...post,
              title: title.trim() || post.title,
              category: category.trim() || post.category,
              author: author.trim() || post.author,
              status,
              publishedAt: status === 'PUBLISHED' ? 'Diperbarui dan diterbitkan' : 'Diperbarui sebagai draft',
              excerpt: excerpt.trim() || post.excerpt,
            }
          : post,
      ),
    );

    resetForm();
    setMessage('Artikel berhasil diperbarui.');
  };

  const togglePublish = (post: BlogPost) => {
    setPosts((current) =>
      current.map((item) =>
        item.id === post.id
          ? {
              ...item,
              status: item.status === 'PUBLISHED' ? 'DRAFT' : 'PUBLISHED',
              publishedAt: item.status === 'PUBLISHED' ? 'Disimpan sebagai draft' : 'Baru dipublikasikan',
            }
          : item,
      ),
    );
    setMessage(`${post.title} statusnya berhasil diubah.`);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <Newspaper className="h-6 w-6 text-cyan-400" />
            Manajemen Blog
          </h1>
          <p className="mt-1 text-sm text-slate-400">Buat, edit, dan atur status publikasi artikel blog Anda.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {stats.map((stat) => {
          const Icon = stat.icon;

          return (
            <div key={stat.label} className="rounded-2xl border border-slate-800 bg-slate-900 p-5">
              <Icon className={`h-5 w-5 ${stat.color}`} />
              <p className="mt-4 font-mono text-3xl font-black">{stat.value}</p>
              <p className="text-xs uppercase tracking-wider text-slate-500">{stat.label}</p>
            </div>
          );
        })}
      </div>

      <form onSubmit={editingPostId ? handleUpdatePost : handleCreatePost} className="grid gap-4 rounded-2xl border border-slate-800 bg-slate-900 p-6 lg:grid-cols-2">
        <input value={title} onChange={(event) => setTitle(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="Judul artikel" required />
        <input value={author} onChange={(event) => setAuthor(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="Penulis" required />
        <input value={category} onChange={(event) => setCategory(event.target.value)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500" placeholder="Kategori" required />
        <select value={status} onChange={(event) => setStatus(event.target.value as BlogStatus)} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500">
          <option value="DRAFT">Draft</option>
          <option value="PUBLISHED">Publikasikan</option>
        </select>
        <textarea value={excerpt} onChange={(event) => setExcerpt(event.target.value)} rows={4} className="rounded-xl border border-slate-800 bg-slate-950 px-3 py-2.5 text-sm outline-none focus:border-cyan-500 lg:col-span-2" placeholder="Ringkasan artikel" required />

        <div className="flex flex-wrap gap-3 lg:col-span-2">
          <button className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-sm font-bold text-white transition hover:bg-cyan-500">
            {editingPostId ? <Pencil className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
            {editingPostId ? 'Simpan Perubahan' : 'Tambah Artikel'}
          </button>
          {editingPostId && (
            <button type="button" onClick={resetForm} className="rounded-xl border border-slate-700 px-4 py-2.5 text-sm font-bold text-slate-300 transition hover:bg-slate-800">
              Batal
            </button>
          )}
        </div>
      </form>

      {message && <p className="text-sm font-semibold text-cyan-300">{message}</p>}

      <div className="rounded-2xl border border-slate-800 bg-slate-900 p-6">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-slate-800 text-xs uppercase tracking-wider text-slate-500">
                <th className="pb-3">Judul</th>
                <th className="pb-3">Kategori</th>
                <th className="pb-3">Penulis</th>
                <th className="pb-3">Status</th>
                <th className="pb-3">Diposting</th>
                <th className="pb-3 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-800/20">
                  <td className="py-4">
                    <p className="font-semibold text-slate-100">{post.title}</p>
                    <p className="mt-1 text-xs text-slate-400">{post.excerpt}</p>
                  </td>
                  <td className="py-4 text-slate-300">{post.category}</td>
                  <td className="py-4 text-slate-300">{post.author}</td>
                  <td className="py-4">
                    <span className={`rounded-md border px-2 py-1 text-[10px] font-bold ${post.status === 'PUBLISHED' ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400' : 'border-amber-500/20 bg-amber-500/10 text-amber-300'}`}>
                      {post.status === 'PUBLISHED' ? 'Terbit' : 'Draft'}
                    </span>
                  </td>
                  <td className="py-4 text-slate-400">{post.publishedAt}</td>
                  <td className="py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button onClick={() => startEdit(post)} className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-cyan-300 transition hover:bg-slate-800">
                        <Pencil className="h-3 w-3" />
                        Edit
                      </button>
                      <button onClick={() => togglePublish(post)} className="inline-flex items-center gap-1 rounded-lg border border-slate-800 bg-slate-950 px-3 py-1.5 text-xs font-bold text-emerald-300 transition hover:bg-slate-800">
                        {post.status === 'PUBLISHED' ? 'Simpan Draft' : 'Publikasikan'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
