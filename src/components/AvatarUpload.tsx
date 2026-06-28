import { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUserStore } from '@/stores/userStore';
import { UserAvatar } from '@/components/UserAvatar';
import { Camera, X, Upload, Trash2 } from 'lucide-react';
import { toast } from '@/hooks/use-toast';

function resizeImage(file: File, maxSize: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);
    img.onload = () => {
      URL.revokeObjectURL(url);
      const canvas = document.createElement('canvas');
      let w = img.width, h = img.height;
      if (w > h) { if (w > maxSize) { h = (h * maxSize) / w; w = maxSize; } }
      else { if (h > maxSize) { w = (w * maxSize) / h; h = maxSize; } }
      canvas.width = w;
      canvas.height = h;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, w, h);
      canvas.toBlob(
        (blob) => blob ? resolve(blob) : reject(new Error('Failed to compress image')),
        'image/jpeg',
        0.85
      );
    };
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Failed to load image')); };
    img.src = url;
  });
}

export function AvatarUpload() {
  const { user, profile, setProfile } = useUserStore();
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [previewBlob, setPreviewBlob] = useState<Blob | null>(null);
  const [uploading, setUploading] = useState(false);

  if (!user || !profile) return null;

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Invalid file', description: 'Please select an image file.', variant: 'destructive' });
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'File too large', description: 'Max file size is 5MB.', variant: 'destructive' });
      return;
    }

    try {
      const resized = await resizeImage(file, 400);
      setPreviewBlob(resized);
      setPreview(URL.createObjectURL(resized));
    } catch {
      toast({ title: 'Error', description: 'Failed to process image.', variant: 'destructive' });
    }
    // Reset input so same file can be re-selected
    e.target.value = '';
  };

  const handleUpload = async () => {
    if (!previewBlob) return;
    setUploading(true);

    try {
      const path = `${user.id}/avatar.jpg`;

      const { error: uploadErr } = await supabase.storage
        .from('avatars')
        .upload(path, previewBlob, { upsert: true, contentType: 'image/jpeg' });

      if (uploadErr) throw uploadErr;

      const { data: urlData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = `${urlData.publicUrl}?t=${Date.now()}`;

      const { error: updateErr } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateErr) throw updateErr;

      setProfile({ ...profile, avatar_url: publicUrl });
      setPreview(null);
      setPreviewBlob(null);
      toast({ title: 'Profile photo updated!' });
    } catch (err: any) {
      toast({ title: 'Upload failed', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const handleRemove = async () => {
    if (!confirm('Remove your profile photo? Your initials avatar will be shown instead.')) return;
    setUploading(true);
    try {
      await supabase.storage.from('avatars').remove([`${user.id}/avatar.jpg`]);
      await supabase.from('profiles').update({ avatar_url: null }).eq('id', user.id);
      setProfile({ ...profile, avatar_url: null });
      toast({ title: 'Photo removed' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  };

  const cancelPreview = () => {
    if (preview) URL.revokeObjectURL(preview);
    setPreview(null);
    setPreviewBlob(null);
  };

  return (
    <div className="flex flex-col items-center gap-3">
      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {preview ? (
        /* Crop preview */
        <div className="flex flex-col items-center gap-3">
          <div className="w-[120px] h-[120px] rounded-full overflow-hidden border-2 border-border">
            <img src={preview} alt="Preview" className="w-full h-full object-cover" />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleUpload}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
            >
              {uploading ? (
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload this photo
            </button>
            <button
              onClick={cancelPreview}
              disabled={uploading}
              className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors disabled:opacity-50"
            >
              Choose different
            </button>
          </div>
        </div>
      ) : (
        /* Avatar with hover overlay */
        <div className="relative group cursor-pointer" onClick={() => fileRef.current?.click()}>
          <UserAvatar
            xp={profile.xp}
            avatarUrl={profile.avatar_url}
            username={profile.username}
            size={120}
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-background/60 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            <Camera className="w-6 h-6 text-foreground" />
            <span className="text-xs text-foreground font-medium mt-1">Change photo</span>
          </div>
        </div>
      )}

      {!preview && (
        <button
          onClick={() => fileRef.current?.click()}
          className="text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          Change photo
        </button>
      )}

      {!preview && profile.avatar_url && (
        <button
          onClick={handleRemove}
          disabled={uploading}
          className="flex items-center gap-1 text-xs text-destructive/70 hover:text-destructive transition-colors disabled:opacity-50"
        >
          <Trash2 className="w-3 h-3" />
          Remove photo
        </button>
      )}
    </div>
  );
}
