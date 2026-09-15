'use client';

import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { API_URL } from '@/lib/api';
import { CalendarDays, User, Tag, ArrowRight, Newspaper } from 'lucide-react';

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

export default function BlogLandingPage() {
  const [blogs, setBlogs] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string>('All');
  const [categories, setCategories] = useState<string[]>(['All']);

  useEffect(() => {
    async function fetchBlogs() {
      try {
        setLoading(true);
        const res = await fetch(`${API_URL}/api/blogs`);
        const json = await res.json();
        if (json.ok && json.data) {
          setBlogs(json.data);
          const uniqueCats = Array.from(new Set(json.data.map((item: BlogPost) => item.category))) as string[];
          setCategories(['All', ...uniqueCats]);
        }
      } catch (err) {
        console.error('Error fetching blogs:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchBlogs();
  }, []);

  const filteredBlogs = selectedCategory === 'All'
    ? blogs
    : blogs.filter((b) => b.category === selectedCategory);

  return (
    <div className="min-h-screen bg-[#0b132b] text-white">
      <Navbar />

      <main className="pt-32 pb-24 max-w-7xl mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-12">
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight mb-4">
            Kabar Terbaru & Inovasi Teknologi
          </h1>
          <p className="text-slate-400 text-base leading-relaxed">
            Dapatkan wawasan mendalam mengenai perkembangan IoT, rantai pasok benih pertanian, blockchain, dan solusi digital terkini dari Electra Tech.
          </p>
        </div>

        {/* Filter Categories */}
        {categories.length > 1 && (
          <div className="flex flex-wrap justify-center gap-2 mb-12">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-semibold transition border ${
                  selectedCategory === cat
                    ? 'bg-cyan-500 text-slate-950 border-cyan-400'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:border-slate-700'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        )}

        {/* Blog Grid */}
        {loading ? (
          <div className="text-center py-20">
            <div className="inline-block animate-spin w-8 h-8 border-4 border-cyan-400 border-t-transparent rounded-full mb-4" />
            <p className="text-slate-400 text-sm">Memuat artikel dan berita...</p>
          </div>
        ) : filteredBlogs.length === 0 ? (
          <div className="text-center py-20 bg-slate-900/50 border border-slate-800 rounded-3xl p-8">
            <p className="text-slate-300 font-semibold text-lg">Belum Ada Artikel Berita</p>
            <p className="text-slate-500 text-sm mt-1">Artikel akan ditampilkan di sini setelah dipublikasikan oleh admin.</p>
          </div>
        ) : (
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredBlogs.map((blog) => (
              <article
                key={blog.id}
                className="bg-slate-900/90 border border-slate-800 rounded-3xl overflow-hidden hover:border-cyan-500/40 transition duration-300 flex flex-col group"
              >
                <div className="relative h-48 w-full bg-slate-950 overflow-hidden">
                  <Image
                    src={blog.thumbnail || 'https://images.unsplash.com/photo-1586771107445-d3ca888129ff?q=80&w=800&auto=format&fit=crop'}
                    alt={blog.title}
                    fill
                    unoptimized
                    className="object-cover group-hover:scale-105 transition duration-500"
                  />
                  <div className="absolute top-4 left-4 bg-slate-950/80 backdrop-blur-md border border-slate-800 text-cyan-400 text-[11px] font-semibold px-3 py-1 rounded-full">
                    {blog.category}
                  </div>
                </div>

                <div className="p-6 flex flex-col flex-1">
                  <div className="flex items-center gap-4 text-slate-400 text-xs mb-3">
                    <span className="flex items-center gap-1">
                      <CalendarDays className="w-3.5 h-3.5 text-cyan-400" />
                      {new Date(blog.created_at).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'short',
                        year: 'numeric',
                      })}
                    </span>
                    <span className="flex items-center gap-1">
                      <User className="w-3.5 h-3.5 text-cyan-400" />
                      {blog.author_name}
                    </span>
                  </div>

                  <h2 className="font-bold text-xl mb-3 text-white line-clamp-2 group-hover:text-cyan-400 transition">
                    {blog.title}
                  </h2>

                  <div
                    className="text-slate-400 text-sm line-clamp-3 mb-6 flex-1 text-xs"
                    dangerouslySetInnerHTML={{
                      __html: blog.content.replace(/<[^>]+>/g, '').substring(0, 150) + '...',
                    }}
                  />

                  <Link
                    href={`/blog/${blog.slug}`}
                    className="inline-flex items-center gap-2 text-cyan-400 text-sm font-semibold hover:text-cyan-300 transition mt-auto"
                  >
                    Baca Selengkapnya
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
              </article>
            ))}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
}
