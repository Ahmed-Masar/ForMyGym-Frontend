'use client';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';

export default function ConfirmDialog({
  open,
  title = 'Are you sure?',
  message,
  confirmLabel = 'Delete',
  cancelLabel = 'Cancel',
  loading = false,
  onConfirm,
  onCancel,
}) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = e => { if (e.key === 'Escape') onCancel(); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            key="bd"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            onClick={onCancel}
            style={{
              position: 'fixed', inset: 0, zIndex: 10998,
              background: 'rgba(0,0,0,0.68)',
              backdropFilter: 'blur(6px)',
              WebkitBackdropFilter: 'blur(6px)',
            }}
          />

          <motion.div
            key="dialog"
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 8 }}
            transition={{ type: 'spring', stiffness: 420, damping: 38, mass: 0.7 }}
            style={{
              position: 'fixed',
              zIndex: 10999,
              top: '50%', left: '50%',
              transform: 'translate(-50%, -50%)',
              width: 'min(86vw, 340px)',
              background: '#111111',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: 20,
              padding: '22px 20px 18px',
              display: 'flex',
              flexDirection: 'column',
              gap: 14,
            }}
          >
            <div>
              <p className="font-bold text-white" style={{ fontSize: 16 }}>{title}</p>
              {message && (
                <p className="mt-1.5" style={{ fontSize: 13, color: 'rgba(255,255,255,0.45)', lineHeight: 1.5 }}>
                  {message}
                </p>
              )}
            </div>

            <div className="flex gap-2.5 mt-1">
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onCancel}
                disabled={loading}
                className="btn btn-ghost flex-1 py-3"
                style={{ fontSize: 13 }}
              >
                {cancelLabel}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.96 }}
                onClick={onConfirm}
                disabled={loading}
                className="btn btn-danger flex-1 py-3"
                style={{ fontSize: 13, opacity: loading ? 0.5 : 1 }}
              >
                {loading ? '…' : confirmLabel}
              </motion.button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
}
