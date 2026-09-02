'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { use, useEffect, useState } from 'react';
import { CalendarDays, User, ArrowLeft, Tag, Share2 } from 'lucide-react';

type BlogPost = {
  id: string;
  title: string;
  thumbnail: string;
  slug: string;
  category: string;
  content: string;
  status: string;
  author_name: string;
  created_at: string;
  published_at?: string;
};

export default function BlogDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const [blog, setBlog] = useState<BlogPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchDetail() {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:4000/api/blogs/${resolvedParams.slug}`);
        const json = await res.json();
        if (json.ok && json.data) {
          setBlog(json.data);
        } else {
          setError(json.message || 'Artikel tidak ditemukan.');
        }
      } catch (err: any) {
        setError('Gagal memuat berita.');
      } finally {
        setLoading(false);
      }
    }
    fetchDetail();
  }, [resolvedParams.slug]);

  return (
    <div className="min-h-screen bg-[#0b132b] text-white">
      <Navbar />

      <main className="pt-32 pb-24 max-w-4xl mx-auto px-6">
        <Link
          href="/blog"
          className="inline-flex items-center gap-2 text-sm text-cyan-400 font-semibold mb-8 hover:text-cyan-300 transition"
        >
          <ArrowLeft className="w-4 h-4" />
          Kembali ke Semua Berita
        </Link>

        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
            <p className="text-slate-400 text-sm">Memuat artikel...</p>
          </div>
        ) : error || !blog ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <h2 className="text-xl font-bold text-red-400 mb-2">Artikel Tidak Ditemukan</h2>
            <p className="text-slate-400 text-sm mb-6">{error || 'Artikel yang Anda cari mungkin sudah dihapus atau ditarik.'}</p>
            <Link href="/blog" className="px-6 py-2.5 bg-cyan-500 text-slate-950 font-bold rounded-xl text-sm">
              Kembali ke Blog
            </Link>
          </div>
        ) : (
          <article className="space-y-8">
            <div>
              <span className="inline-block bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 text-xs font-semibold px-3 py-1 rounded-full mb-4">
                {blog.category}
              </span>
              <h1 className="text-3xl md:text-5xl font-bold tracking-tight leading-tight mb-6 text-white">
                {blog.title}
              </h1>

              <div className="flex flex-wrap items-center gap-6 text-sm text-slate-400 border-y border-slate-800 py-4">
                <span className="flex items-center gap-2">
                  <User className="w-4 h-4 text-cyan-400" />
                  <strong className="text-slate-200">{blog.author_name}</strong>
                </span>
                <span className="flex items-center gap-2">
                  <CalendarDays className="w-4 h-4 text-cyan-400" />
                  {new Date(blog.created_at).toLocaleDateString('id-ID', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
            </div>

            {blog.thumbnail && (
              <div className="relative h-[300px] md:h-[450px] w-full rounded-3xl overflow-hidden border border-slate-800">
                <Image
                  src={blog.thumbnail}
                  alt={blog.title}
                  fill
                  unoptimized
                  className="object-cover"
                  priority
                />
              </div>
            )}

            <div
              className="prose prose-invert max-w-none text-slate-300 leading-relaxed space-y-4"
              dangerouslySetInnerHTML={{ __html: blog.content }}
            />
          </article>
        )}
      </main>
      <Footer />
    </div>
  );
}
