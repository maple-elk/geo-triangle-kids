import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { playVictorySound } from '../utils/audio';

const CHALLENGES = [
  {
    id: 1,
    title: 'Quest 1: Square Corner!',
    description: 'Drag the points until one corner reaches exactly 90.0° to form a Right Triangle!',
    icon: '📐',
    check: (angles) => {
      const { angleA, angleB, angleC } = angles;
      return (
        Math.abs(angleA - 90) <= 0.8 ||
        Math.abs(angleB - 90) <= 0.8 ||
        Math.abs(angleC - 90) <= 0.8
      );
    },
  },
  {
    id: 2,
    title: 'Quest 2: Wide Obtuse Angle!',
    description: 'Drag points to make a giant wide angle! Create one corner greater than 110°.',
    icon: '🛏️',
    check: (angles) => {
      return (
        angles.angleA >= 110.0 ||
        angles.angleB >= 110.0 ||
        angles.angleC >= 110.0
      );
    },
  },
  {
    id: 3,
    title: 'Quest 3: Perfect Harmony (60°)!',
    description: 'Make all three corners equal to 60.0° to form a perfectly balanced Equilateral Triangle!',
    icon: '🔺',
    check: (angles) => {
      const { angleA, angleB, angleC } = angles;
      return (
        Math.abs(angleA - 60) <= 2.5 &&
        Math.abs(angleB - 60) <= 2.5 &&
        Math.abs(angleC - 60) <= 2.5
      );
    },
  },
  {
    id: 4,
    title: 'Quest 4: Super Sharp Corner!',
    description: 'Make all three internal angles smaller than 70.0° (Acute Triangle)!',
    icon: '⚡',
    check: (angles) => {
      return (
        angles.angleA < 70.0 &&
        angles.angleB < 70.0 &&
        angles.angleC < 70.0
      );
    },
  },
];

export default function ChallengeMode({ angles, soundEnabled }) {
  const [currentIdx, setCurrentIdx] = useState(0);
  const [completedQuests, setCompletedQuests] = useState([]);

  const quest = CHALLENGES[currentIdx];
  const isCompleted = completedQuests.includes(quest.id);

  useEffect(() => {
    if (!isCompleted && quest.check(angles)) {
      // Mark completed
      setCompletedQuests((prev) => [...prev, quest.id]);
      playVictorySound(soundEnabled);

      // Trigger Confetti
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch (e) {}
    }
  }, [angles, isCompleted, quest, soundEnabled]);

  const handleNext = () => {
    if (currentIdx < CHALLENGES.length - 1) {
      setCurrentIdx((prev) => prev + 1);
    } else {
      setCurrentIdx(0); // Loop back
    }
  };

  return (
    <div className="challenge-card">
      <div className="challenge-header">
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <span style={{ fontSize: '1.4rem' }}>{quest.icon}</span>
          <span style={{ fontFamily: 'Fredoka', fontSize: '1.15rem', color: '#ffffff' }}>
            {quest.title}
          </span>
        </div>
        <div className="stars-row">
          {CHALLENGES.map((ch) => (
            <span key={ch.id}>
              {completedQuests.includes(ch.id) ? '⭐' : '⚪'}
            </span>
          ))}
        </div>
      </div>

      <div className="challenge-desc">
        {quest.description}
      </div>

      {isCompleted ? (
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <span style={{ color: '#4ade80', fontWeight: '700', fontSize: '1rem' }}>
            🎉 Quest Achieved! Star Earned!
          </span>
          <button className="btn-primary" onClick={handleNext}>
            Next Quest ➡️
          </button>
        </div>
      ) : (
        <div style={{ fontSize: '0.82rem', color: 'var(--color-text-muted)', fontStyle: 'italic' }}>
          Drag the triangle handles above to achieve this target...
        </div>
      )}
    </div>
  );
}
