import React, { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { BottomSheet } from './BottomSheet';

interface LoginModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (adminCode: string) => Promise<void>;
}

export const LoginModal: React.FC<LoginModalProps> = ({ isOpen, onClose, onSignIn }) => {
  const [code, setCode] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await onSignIn(code);
      setCode('');
      onClose();
    } catch {
      setError('Mã admin không đúng.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <BottomSheet isOpen={isOpen} onClose={onClose} title="Nhập mã admin" maxWidth="max-w-sm">
      <form onSubmit={handleSubmit} className="space-y-3">
        <p className="text-xs text-[#5C695E]">
          Chỉ trưởng nhóm cần mã này để tạo buổi, thu tiền và sửa dữ liệu. Thành viên chỉ cần mở link là xem được.
        </p>
        <input
          type="password"
          autoComplete="current-password"
          required
          autoFocus
          value={code}
          onChange={(e) => setCode(e.target.value)}
          placeholder="Mã admin"
          className="w-full px-3.5 py-3 rounded-xl bg-white border border-[#DDD7C9] text-base text-center tracking-widest focus:outline-none focus:border-[#1F7A52]"
        />
        {error && <p className="text-xs font-semibold text-[#C53030]">{error}</p>}
        <button
          type="submit"
          disabled={isSubmitting || !code}
          className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#1F7A52] hover:bg-[#186241] disabled:opacity-60 text-white text-sm font-bold cursor-pointer"
        >
          <KeyRound className="w-4 h-4" />
          {isSubmitting ? 'Đang kiểm tra…' : 'Vào chế độ trưởng nhóm'}
        </button>
      </form>
    </BottomSheet>
  );
};
