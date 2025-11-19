import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { springs } from '../../core/physics/springs';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';

interface Question {
  id: number;
  text: string;
  options: string[];
}

const MOCK_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "When learning something new, I prefer to...",
    options: [
      "Jump right in and try it out.",
      "Listen and observe others first.",
      "Read the instructions and theory.",
      "Rely on my intuition and feelings."
    ]
  },
  {
    id: 2,
    text: "I learn best when...",
    options: [
      "I can practice and experiment.",
      "I have time to think about what happened.",
      "The ideas are logical and rational.",
      "I am personally involved in the experience."
    ]
  },
  {
    id: 3,
    text: "When solving problems, I tend to...",
    options: [
      "Try out different solutions until one works.",
      "Look for the core problem before acting.",
      "Analyze the situation logically.",
      "Trust my gut instincts."
    ]
  }
];

const ActiveExperimentationRoom: React.FC = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [direction, setDirection] = useState(0);
  
  const titleRef = useRef<HTMLHeadingElement>(null);
  useRoomFocus(titleRef);

  const currentQuestion = MOCK_QUESTIONS[currentQuestionIndex];
  const totalQuestions = MOCK_QUESTIONS.length;
  const progress = ((currentQuestionIndex + 1) / totalQuestions) * 100;

  const handleAnswer = (optionIndex: number) => {
    setAnswers(prev => ({
      ...prev,
      [currentQuestion.id]: optionIndex
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentQuestionIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setDirection(-1);
      setCurrentQuestionIndex(prev => prev - 1);
    }
  };

  const variants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1,
      scale: 1,
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 50 : -50,
      opacity: 0,
      scale: 0.95,
    }),
  };

  return (
    <PageShell>
      <RoomContent>
        <motion.div
          variants={staggerContainer}
          initial="hidden"
          animate="visible"
          className="w-full max-w-3xl flex flex-col items-center gap-8"
        >
          <div className="text-center max-w-2xl" ref={titleRef} tabIndex={-1} className="outline-none">
            <DisplayTitle variants={fadeInUp}>Active Experimentation</DisplayTitle>
            <BodyText tone="muted" className="mt-4" variants={fadeInUp}>
              Putting ideas into action. This stage focuses on practical application and getting things done.
            </BodyText>
          </div>

          {/* Progress Bar */}
          <motion.div variants={scaleIn} className="w-full h-1 bg-white/10 rounded-full overflow-hidden">
            <motion.div 
              className="h-full bg-amber-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ type: "spring", stiffness: 50, damping: 20 }}
            />
          </motion.div>

          {/* Question Card */}
          <div className="w-full relative min-h-[400px]">
            <AnimatePresence initial={false} custom={direction} mode="wait">
              <motion.div
                key={currentQuestion.id}
                custom={direction}
                variants={variants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={springs.medium}
                className="w-full absolute inset-0"
              >
                <GlassMaterial intensity="high" className="p-8 md:p-12 flex flex-col gap-8 h-full">
                  <div className="flex justify-between items-center text-white/40 text-sm font-mono uppercase tracking-widest">
                    <span>Question {currentQuestionIndex + 1} of {totalQuestions}</span>
                    <span>Doing</span>
                  </div>

                  <h3 className="text-2xl md:text-3xl font-bold text-white leading-tight">
                    {currentQuestion.text}
                  </h3>

                  <div className="flex flex-col gap-3">
                    {currentQuestion.options.map((option, idx) => {
                      const isSelected = answers[currentQuestion.id] === idx;
                      return (
                        <motion.button
                          key={idx}
                          onClick={() => handleAnswer(idx)}
                          className={`w-full text-left p-4 rounded-lg border transition-all duration-200 flex items-center gap-4 group ${
                            isSelected 
                              ? 'bg-amber-500/20 border-amber-500/50 text-white' 
                              : 'bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/20'
                          }`}
                          whileHover={{ scale: 1.01 }}
                          whileTap={{ scale: 0.99 }}
                        >
                          <div className={`w-6 h-6 rounded-full border flex items-center justify-center transition-colors ${
                            isSelected ? 'border-amber-500 bg-amber-500' : 'border-white/30 group-hover:border-white/50'
                          }`}>
                            {isSelected && <motion.div layoutId="check" className="text-black text-xs font-bold">✓</motion.div>}
                          </div>
                          <span className="text-lg">{option}</span>
                        </motion.button>
                      );
                    })}
                  </div>

                  <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
                    <button
                      onClick={handlePrev}
                      disabled={currentQuestionIndex === 0}
                      className="px-6 py-2 rounded-full text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Previous
                    </button>
                    
                    <button
                      onClick={handleNext}
                      disabled={answers[currentQuestion.id] === undefined}
                      className={`px-8 py-2 rounded-full font-semibold transition-all ${
                        answers[currentQuestion.id] !== undefined
                          ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                          : 'bg-white/10 text-white/30 cursor-not-allowed'
                      }`}
                    >
                      {currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next'}
                    </button>
                  </div>
                </GlassMaterial>
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
      </RoomContent>
    </PageShell>
  );
};

export default ActiveExperimentationRoom;
