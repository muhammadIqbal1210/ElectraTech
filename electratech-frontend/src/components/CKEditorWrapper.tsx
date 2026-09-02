'use client';

import { useEffect, useRef } from 'react';

interface CKEditorProps {
  value: string;
  onChange: (data: string) => void;
  placeholder?: string;
}

class CustomUploadAdapter {
  loader: any;
  constructor(loader: any) {
    this.loader = loader;
  }

  upload() {
    return this.loader.file.then(
      (file: File) =>
        new Promise((resolve, reject) => {
          const data = new FormData();
          data.append('image', file);

          fetch('http://localhost:4000/api/upload', {
            method: 'POST',
            body: data,
          })
            .then((res) => res.json())
            .then((res) => {
              if (res.ok && res.url) {
                resolve({
                  default: res.url,
                });
              } else {
                reject(res.message || 'Gagal mengunggah gambar');
              }
            })
            .catch((err) => {
              reject(err.message || 'Gagal terhubung ke server upload');
            });
        })
    );
  }

  abort() {}
}

function CustomUploadAdapterPlugin(editor: any) {
  editor.plugins.get('FileRepository').createUploadAdapter = (loader: any) => {
    return new CustomUploadAdapter(loader);
  };
}

export default function CKEditorWrapper({ value, onChange, placeholder }: CKEditorProps) {
  const editorRef = useRef<HTMLDivElement>(null);
  const ckInstanceRef = useRef<any>(null);

  useEffect(() => {
    let isMounted = true;

    const loadScript = async () => {
      if (!window || !(window as any).ClassicEditor) {
        if (!document.getElementById('ckeditor-script')) {
          const script = document.createElement('script');
          script.id = 'ckeditor-script';
          script.src = 'https://cdn.ckeditor.com/ckeditor5/39.0.1/classic/ckeditor.js';
          script.async = true;
          document.body.appendChild(script);
          await new Promise((resolve) => {
            script.onload = resolve;
          });
        } else {
          await new Promise((resolve) => {
            const checkInterval = setInterval(() => {
              if ((window as any).ClassicEditor) {
                clearInterval(checkInterval);
                resolve(true);
              }
            }, 50);
          });
        }
      }

      if (isMounted && editorRef.current && !ckInstanceRef.current && (window as any).ClassicEditor) {
        try {
          const editor = await (window as any).ClassicEditor.create(editorRef.current, {
            extraPlugins: [CustomUploadAdapterPlugin],
            placeholder: placeholder || 'Ketikkan isi berita atau artikel di sini...',
            toolbar: [
              'heading',
              '|',
              'bold',
              'italic',
              'link',
              'uploadImage',
              'bulletedList',
              'numberedList',
              'blockQuote',
              '|',
              'undo',
              'redo',
            ],
          });

          ckInstanceRef.current = editor;
          if (value) {
            editor.setData(value);
          }

          editor.model.document.on('change:data', () => {
            const data = editor.getData();
            onChange(data);
          });
        } catch (err) {
          console.error('CKEditor initialization error:', err);
        }
      }
    };

    loadScript();

    return () => {
      isMounted = false;
      if (ckInstanceRef.current) {
        ckInstanceRef.current.destroy().catch((err: any) => console.error(err));
        ckInstanceRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    if (ckInstanceRef.current && value !== ckInstanceRef.current.getData()) {
      ckInstanceRef.current.setData(value || '');
    }
  }, [value]);

  return (
    <div className="ck-dark-theme rounded-xl border border-slate-800 bg-slate-950 overflow-hidden text-slate-900">
      <style jsx global>{`
        .ck-editor__editable {
          min-height: 250px;
          background-color: #020617 !important;
          color: #f8fafc !important;
        }
        .ck.ck-editor__main>.ck-editor__editable:focus {
          border-color: #06b6d4 !important;
        }
        .ck.ck-toolbar {
          background-color: #0f172a !important;
          border-color: #1e293b !important;
        }
        .ck.ck-toolbar .ck-button {
          color: #94a3b8 !important;
        }
        .ck.ck-toolbar .ck-button:hover {
          background-color: #1e293b !important;
          color: #38bdf8 !important;
        }
        .ck.ck-toolbar .ck-button.ck-on {
          background-color: #0284c7 !important;
          color: #ffffff !important;
        }
        .ck.ck-dropdown__panel {
          background-color: #0f172a !important;
          border-color: #1e293b !important;
        }
        .ck.ck-list__item .ck-button {
          color: #cbd5e1 !important;
        }
      `}</style>
      <div ref={editorRef} />
    </div>
  );
}
