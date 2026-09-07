import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../api/axios';
import { FiX, FiLoader, FiSend, FiEye, FiEdit3, FiImage } from 'react-icons/fi';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import toast from 'react-hot-toast';

const CATEGORIES = ['UI/UX', 'Integrations', 'Performance', 'General'];

const CATEGORY_ICONS = {
  'UI/UX': '🎨',
  'Integrations': '🔌',
  'Performance': '⚡',
  'General': '💡',
};

export default function PostModal({ onClose }) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('write'); // 'write' | 'preview'
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState('');
  const fileInputRef = useRef(null);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isValid },
  } = useForm({
    mode: 'onChange',
    defaultValues: { title: '', description: '', category: 'General' },
  });

  const descriptionValue = watch('description');

  const mutation = useMutation({
    mutationFn: (data) => {
      const formData = new FormData();
      formData.append('title', data.title);
      formData.append('description', data.description);
      formData.append('category', data.category);
      if (imageFile) {
        formData.append('image', imageFile);
      }
      return api.post('/posts', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
    },
    onSuccess: () => {
      toast.success('Feature request submitted! 🎉');
      queryClient.invalidateQueries({ queryKey: ['posts'] });
      onClose();
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Failed to submit. Please try again.');
    },
  });

  const handleImageChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image must be less than 5MB');
        return;
      }
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => setImagePreview(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const onSubmit = (data) => mutation.mutate(data);

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="modal-panel max-w-2xl p-8 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Submit a Feature Request</h2>
            <p className="text-white/50 text-sm mt-1">Help us build what matters most to you</p>
          </div>
          <button onClick={onClose} className="btn-ghost p-2 rounded-xl">
            <FiX className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Title */}
          <div>
            <label className="label">Title <span className="text-red-400">*</span></label>
            <input
              id="post-title"
              type="text"
              className={`input ${errors.title ? 'input-error' : ''}`}
              placeholder="Short, clear title for your feature idea…"
              {...register('title', {
                required: 'Title is required',
                minLength: { value: 5, message: 'At least 5 characters' },
                maxLength: { value: 150, message: 'Maximum 150 characters' },
              })}
            />
            {errors.title && (
              <p className="mt-1 text-xs text-red-400">{errors.title.message}</p>
            )}
          </div>

          {/* Category */}
          <div>
            <label className="label">Category <span className="text-red-400">*</span></label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {CATEGORIES.map((cat) => {
                const isSelected = watch('category') === cat;
                return (
                  <label
                    key={cat}
                    className={`flex items-center gap-2 p-3 rounded-xl border cursor-pointer transition-all duration-150 ${
                      isSelected
                        ? 'bg-brand-600/20 border-brand-500/50 text-brand-200'
                        : 'bg-surface-900/60 border-white/[0.06] text-white/50 hover:border-white/20 hover:text-white/80'
                    }`}
                  >
                    <input
                      type="radio"
                      value={cat}
                      className="sr-only"
                      {...register('category', { required: true })}
                    />
                    <span className="text-lg">{CATEGORY_ICONS[cat]}</span>
                    <span className="text-xs font-medium">{cat}</span>
                  </label>
                );
              })}
            </div>
          </div>

          {/* Description with Markdown toggle */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="label mb-0">
                Description <span className="text-red-400">*</span>
              </label>
              <div className="flex items-center gap-0.5 bg-surface-900/60 border border-white/[0.06] rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setActiveTab('write')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'write' ? 'bg-surface-700 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <FiEdit3 className="w-3 h-3" />
                  Write
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab('preview')}
                  className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-medium transition-all ${
                    activeTab === 'preview' ? 'bg-surface-700 text-white' : 'text-white/40 hover:text-white/70'
                  }`}
                >
                  <FiEye className="w-3 h-3" />
                  Preview
                </button>
              </div>
            </div>

            {activeTab === 'write' ? (
              <textarea
                id="post-description"
                rows={6}
                className={`input resize-none font-mono text-xs leading-relaxed ${errors.description ? 'input-error' : ''}`}
                placeholder="Describe the feature in detail. **Markdown** is supported…"
                {...register('description', {
                  required: 'Description is required',
                  minLength: { value: 20, message: 'At least 20 characters' },
                  maxLength: { value: 5000, message: 'Maximum 5000 characters' },
                })}
              />
            ) : (
              <div className="min-h-[144px] input bg-surface-900/40 markdown-body">
                {descriptionValue ? (
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{descriptionValue}</ReactMarkdown>
                ) : (
                  <span className="text-white/25 text-xs italic">Nothing to preview yet…</span>
                )}
              </div>
            )}
            
            <div className="flex items-center justify-between mt-1">
              {errors.description ? (
                <p className="text-xs text-red-400">{errors.description.message}</p>
              ) : (
                <p className="text-xs text-white/25">Supports **bold**, *italic*, `code`, lists</p>
              )}
              <p className={`text-xs tabular-nums ${(descriptionValue?.length || 0) > 5000 ? 'text-red-400' : 'text-white/25'}`}>
                {descriptionValue?.length || 0}/5000
              </p>
            </div>
          </div>

          {/* Optional Image Upload */}
          <div>
            <label className="label">Attachment (Optional)</label>
            <div className="mt-1">
              {imagePreview ? (
                <div className="relative inline-block border border-white/[0.06] rounded-xl overflow-hidden group">
                  <img src={imagePreview} alt="Preview" className="max-h-40 object-cover opacity-90" />
                  <button
                    type="button"
                    onClick={clearImage}
                    className="absolute top-2 right-2 bg-black/60 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="btn-ghost px-4 py-2 text-sm border border-white/[0.06] border-dashed"
                  >
                    <FiImage className="w-4 h-4 text-brand-400" />
                    Attach Image
                  </button>
                  <span className="text-xs text-white/30">Max 5MB (jpg, png, webp)</span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/jpeg, image/png, image/webp"
                className="hidden"
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-secondary flex-1 justify-center py-3">
              Cancel
            </button>
            <button
              type="submit"
              id="submit-post-btn"
              disabled={!isValid || mutation.isPending}
              className="btn-primary flex-1 justify-center py-3"
            >
              {mutation.isPending ? (
                <FiLoader className="w-4 h-4 animate-spin" />
              ) : (
                <FiSend className="w-4 h-4" />
              )}
              {mutation.isPending ? 'Submitting...' : 'Submit Request'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
