import React, { useRef, useState, useEffect } from 'react';

export default function OfferImageUploader({ onFileSelected, error, initialImageUrl = null }) {
  const ref = useRef(null);
  const [preview, setPreview] = useState(initialImageUrl || null);

  function onChange(e) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;
    onFileSelected?.(file);
    const url = URL.createObjectURL(file);
    setPreview(url);
  }

  useEffect(() => {
    setPreview(initialImageUrl || null);
  }, [initialImageUrl]);

  useEffect(() => {
    return () => {
      if (preview && preview.startsWith('blob:')) URL.revokeObjectURL(preview);
    };
  }, [preview]);

  return (
    <div className={error ? 'space-y-2' : 'space-y-2'}>
      <div
        role="button"
        tabIndex={0}
        onKeyDown={(e) => { if (e.key === 'Enter' || e.key === ' ') ref.current?.click(); }}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center justify-center text-center bg-surface-bright hover:bg-surface-container-low transition-colors cursor-pointer group min-h-[10rem] ${error ? 'border-red-500' : 'border-border-subtle'}`}
        onClick={() => ref.current?.click()}
      >
        {preview ? (
          <div className="w-full h-full flex items-center justify-center">
            <img src={preview} alt="preview" className="max-h-48 object-contain" />
          </div>
        ) : (
          <>
            <div className="mb-3">
              <span className="material-symbols-outlined text-3xl">cloud_upload</span>
            </div>
            <div className="mb-2 font-body-md">اسحب وأفلت أو انقر لتصفح الملفات (PNG, JPG حتى 5MB)</div>
          </>
        )}
        <input ref={ref} type="file" accept="image/png, image/jpeg" className="hidden" onChange={onChange} />
      </div>
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  );
}
