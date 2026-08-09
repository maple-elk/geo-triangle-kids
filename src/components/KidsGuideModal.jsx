import React from 'react';
import { X } from 'lucide-react';

export default function KidsGuideModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div className="modal-title">🌟 Geometry Guide for Young Explorers</div>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: '#cbd5e1', lineHeight: '1.5' }}>
          <div>
            <h4 style={{ color: '#ff5e7e', fontFamily: 'Fredoka', fontSize: '1.1rem', marginBottom: '4px' }}>
              1. What is an Internal Angle?
            </h4>
            <p style={{ fontSize: '0.92rem' }}>
              An angle measures how wide open a corner is where two straight sides meet! We measure angles in <strong>degrees (°)</strong>.
            </p>
          </div>

          <div>
            <h4 style={{ color: '#10b981', fontFamily: 'Fredoka', fontSize: '1.1rem', marginBottom: '4px' }}>
              2. The Magic 180° Rule
            </h4>
            <p style={{ fontSize: '0.92rem' }}>
              No matter how tall, wide, or strange you drag your triangle, the 3 corner angles will <strong>ALWAYS add up to 180°</strong>! If one corner gets wider, the other corners must shrink to compensate!
            </p>
          </div>

          <div>
            <h4 style={{ color: '#06b6d4', fontFamily: 'Fredoka', fontSize: '1.1rem', marginBottom: '4px' }}>
              3. Three Angle Personalities
            </h4>
            <ul style={{ paddingLeft: '20px', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <li>📐 <strong>Right Angle (90°):</strong> A perfect square corner, like the edge of a book!</li>
              <li>⚡ <strong>Acute Angle (&lt; 90°):</strong> Sharp and narrow corner, smaller than 90°.</li>
              <li>🛏️ <strong>Obtuse Angle (&gt; 90°):</strong> Wide and open corner, larger than 90°.</li>
            </ul>
          </div>
        </div>

        <div style={{ marginTop: '10px', textAlign: 'right' }}>
          <button className="btn-primary" onClick={onClose}>
            Got it, let's explore! 🚀
          </button>
        </div>
      </div>
    </div>
  );
}
