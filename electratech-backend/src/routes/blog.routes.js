const express = require('express');
const pool = require('../config/db');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler, createError } = require('../utils/http');

const router = express.Router();

function createSlug(title) {
  return String(title || '')
    .trim()
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

async function generateUniqueSlug(title, currentId = null) {
  let baseSlug = createSlug(title) || 'berita';
  let slug = baseSlug;
  let counter = 1;

  while (true) {
    const existing = await pool.query(
      'select id from blogs where slug = $1 and ($2::uuid is null or id != $2::uuid)',
      [slug, currentId]
    );
    if (existing.rows.length === 0) {
      break;
    }
    counter += 1;
    slug = `${baseSlug}-${counter}`;
  }

  return slug;
}

// GET /api/blogs (Public)
router.get('/blogs', asyncHandler(async (req, res) => {
  const { category, search, limit = 10, page = 1 } = req.query;
  const offset = (Number(page) - 1) * Number(limit);

  let query = `
    select id, title, thumbnail, slug, category, content, status, author_name, created_at, updated_at, published_at
    from blogs
    where status = 'PUBLISHED'
  `;
  const params = [];

  if (category) {
    params.push(category);
    query += ` and category = $${params.length}`;
  }

  if (search) {
    params.push(`%${search}%`);
    query += ` and (title ilike $${params.length} or content ilike $${params.length})`;
  }

  query += ` order by created_at desc limit $${params.length + 1} offset $${params.length + 2}`;
  params.push(Number(limit), offset);

  const countQuery = `
    select count(*) as total
    from blogs
    where status = 'PUBLISHED'
    ${category ? ' and category = $1' : ''}
    ${search ? ` and (title ilike ${category ? '$2' : '$1'} or content ilike ${category ? '$2' : '$1'})` : ''}
  `;
  const countParams = [];
  if (category) countParams.push(category);
  if (search) countParams.push(`%${search}%`);

  const [resList, resCount] = await Promise.all([
    pool.query(query, params),
    pool.query(countQuery, countParams)
  ]);

  res.json({
    ok: true,
    data: resList.rows,
    pagination: {
      total: parseInt(resCount.rows[0].total, 10),
      page: Number(page),
      limit: Number(limit)
    }
  });
}));

// GET /api/blogs/:slug (Public)
router.get('/blogs/:slug', asyncHandler(async (req, res) => {
  const { slug } = req.params;
  const result = await pool.query(
    `select id, title, thumbnail, slug, category, content, status, author_name, created_at, updated_at, published_at
     from blogs
     where slug = $1 and status = 'PUBLISHED'`,
    [slug]
  );

  if (result.rows.length === 0) {
    throw createError(404, 'Berita tidak ditemukan.');
  }

  res.json({ ok: true, data: result.rows[0] });
}));

// Admin Routes below
router.get('/admin/blogs', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const result = await pool.query(
    `select id, title, thumbnail, slug, category, content, status, author_name, created_at, updated_at, published_at
     from blogs
     order by created_at desc`
  );
  res.json({ ok: true, data: result.rows });
}));

router.post('/admin/blogs', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { title, thumbnail, category, content, status = 'DRAFT', author_name } = req.body;

  if (!title || !thumbnail || !content) {
    throw createError(400, 'Judul, thumbnail, dan konten wajib diisi.');
  }

  const slug = await generateUniqueSlug(title);
  const author = author_name || req.user?.name || 'Admin Electra';
  const publishedAt = status === 'PUBLISHED' ? new Date() : null;

  const result = await pool.query(
    `insert into blogs (title, thumbnail, slug, category, content, status, author_name, published_at)
     values ($1, $2, $3, $4, $5, $6, $7, $8)
     returning id, title, thumbnail, slug, category, content, status, author_name, created_at, updated_at, published_at`,
    [title, thumbnail, slug, category || 'Umum', content, status, author, publishedAt]
  );

  res.status(201).json({ ok: true, data: result.rows[0] });
}));

router.put('/admin/blogs/:id', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { title, thumbnail, category, content, status, author_name } = req.body;

  if (!title || !thumbnail || !content || !status) {
    throw createError(400, 'Judul, thumbnail, konten, dan status wajib diisi.');
  }

  const existing = await pool.query('select status, title from blogs where id = $1', [id]);
  if (existing.rows.length === 0) {
    throw createError(404, 'Berita tidak ditemukan.');
  }

  let slug;
  if (title !== existing.rows[0].title) {
    slug = await generateUniqueSlug(title, id);
  }

  let publishedAtQuery = '';
  const updateParams = [title, thumbnail, category || 'Umum', content, status, author_name || 'Admin Electra', id];

  if (slug) {
    updateParams.unshift(slug);
  }

  let query = `
    update blogs
    set title = $1,
        thumbnail = $2,
        category = $3,
        content = $4,
        status = $5,
        author_name = $6,
        updated_at = now()
  `;

  if (slug) {
    query = `
      update blogs
      set slug = $1,
          title = $2,
          thumbnail = $3,
          category = $4,
          content = $5,
          status = $6,
          author_name = $7,
          updated_at = now()
    `;
  }

  if (status === 'PUBLISHED' && existing.rows[0].status !== 'PUBLISHED') {
    query += `, published_at = now()`;
  }

  query += ` where id = ${slug ? '$8' : '$7'} returning id, title, thumbnail, slug, category, content, status, author_name, created_at, updated_at, published_at`;

  const result = await pool.query(query, updateParams);
  res.json({ ok: true, data: result.rows[0] });
}));

router.delete('/admin/blogs/:id', requireAuth, requireRole('ADMIN'), asyncHandler(async (req, res) => {
  const { id } = req.params;
  const result = await pool.query('delete from blogs where id = $1 returning id', [id]);

  if (result.rows.length === 0) {
    throw createError(404, 'Berita tidak ditemukan.');
  }

  res.json({ ok: true, data: result.rows[0] });
}));

module.exports = router;
