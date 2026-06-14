import { useRef, useState } from 'react';
import { Upload, Link2, X, Loader2, ImagePlus } from 'lucide-react';
import toast from 'react-hot-toast';
import { uploadService } from '../../services/upload.service';

/**
 * Image uploader supporting BOTH local file upload (→ S3) and URL paste.
 *
 * Props:
 * - value: string (single mode) or string[] (multiple mode)
 * - onChange: (next) => void  — receives string or string[]
 * - folder: 'products' | 'blogs' | 'misc'
 * - multiple: boolean (default false)
 * - label: string
 */
export default function ImageUploader({
  value,
  onChange,
  folder = 'misc',
  multiple = false,
  label = 'Image',
}) {
  const fileRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState('');

  const images = multiple ? (Array.isArray(value) ? value : []) : value ? [value] : [];

  const emit = (next) => {
    if (multiple) onChange(next);
    else onChange(next[0] || '');
  };

  const handleFiles = async (files) => {
    const list = Array.from(files).filter((f) => f.type.startsWith('image/'));
    if (list.length === 0) return;
    if (!multiple && list.length > 1) list.splice(1);

    setUploading(true);
    try {
      const uploaded = [];
      for (const file of list) {
        const url = await uploadService.uploadImage(file, folder);
        if (url) uploaded.push(url);
      }
      if (uploaded.length) {
        emit(multiple ? [...images, ...uploaded] : uploaded);
        toast.success(`${uploaded.length} image${uploaded.length > 1 ? 's' : ''} uploaded`);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || 'Upload failed');
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const addUrl = () => {
    const url = urlInput.trim();
    if (!url) return;
    if (!/^https?:\/\//i.test(url)) {
      toast.error('Enter a valid http(s) URL');
      return;
    }
    emit(multiple ? [...images, url] : [url]);
    setUrlInput('');
  };

  const removeAt = (idx) => {
    const next = images.filter((_, i) => i !== idx);
    emit(next);
  };

  return (
    <div>
      <label className="label">{label}</label>

      {/* Previews */}
      {images.length > 0 && (
        <div className="flex flex-wrap gap-3 mb-3">
          {images.map((img, i) => (
            <div key={`${img}-${i}`} className="relative group w-24 h-24 rounded-lg overflow-hidden border border-gray-200 bg-gray-50">
              <img src={img} alt="" className="w-full h-full object-cover" />
              <button
                type="button"
                onClick={() => removeAt(i)}
                className="absolute top-1 right-1 w-5 h-5 bg-black/60 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
                aria-label="Remove image"
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Drop / click zone */}
      <div
        onClick={() => !uploading && fileRef.current?.click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => { e.preventDefault(); handleFiles(e.dataTransfer.files); }}
        className={`border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary-400 transition ${uploading ? 'opacity-60 pointer-events-none' : ''}`}
      >
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          multiple={multiple}
          className="hidden"
          onChange={(e) => handleFiles(e.target.files)}
        />
        {uploading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
            <Loader2 size={16} className="animate-spin" /> Uploading…
          </div>
        ) : (
          <div className="flex items-center justify-center gap-2 text-sm text-gray-500 py-2">
            <Upload size={16} /> Click or drag to upload {multiple ? 'images' : 'an image'} from your computer
          </div>
        )}
      </div>

      {/* URL input */}
      <div className="flex gap-2 mt-2">
        <div className="relative flex-1">
          <Link2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="…or paste an image URL"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addUrl(); } }}
          />
        </div>
        <button type="button" onClick={addUrl} className="btn-secondary shrink-0">
          <ImagePlus size={15} /> Add
        </button>
      </div>
    </div>
  );
}
