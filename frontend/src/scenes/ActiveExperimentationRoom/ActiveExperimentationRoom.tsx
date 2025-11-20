import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { GlassMaterial } from '../../core/design-system/Materials';
import { DisplayTitle, BodyText } from '../../core/design-system/Typography';
import { PageShell, RoomContent } from '../../core/design-system/Layout';
import { fadeInUp, staggerContainer, scaleIn } from '../../core/physics/motionPrimitives';
import { springs } from '../../core/physics/springs';
import { useRoomFocus } from '../../core/accessibility/useRoomFocus';
import { api, AssessmentItem, AssessmentItemOption, SessionSubmissionPayload, ContextRank, ApiError } from '../../core/api/client';
import { AuthNotice } from '../../core/auth/AuthNotice';
import { LFIContextCard } from '../../components/assessment/LFIContextCard';
import { validateContextRanks } from '../../utils/contextHelpers';

// --- Helper Functions ---

/**
 * Maps local state (answers) to the backend DTO format.
 * Handles both Learning Style (ranking) and Learning Flexibility (contextual) items.
 * 
 * Assumptions:
 * - Learning Style items use 1-4 ranking.
 * - Learning Flexibility items map options to CE/RO/AC/AE modes.
 */
const buildSubmissionPayload = (
    items: AssessmentItem[],
    answers: Record<number, Record<number, number>>
): SessionSubmissionPayload => {
    const payload: SessionSubmissionPayload = {
        items: [],
        contexts: []
    };

    items.forEach(item => {
        const itemAnswers = answers[item.id];
        if (!itemAnswers) return;

        if (item.type === 'Learning_Style') {
            payload.items.push({
                item_id: item.id,
                ranks: itemAnswers
            });
        } else if (item.type === 'Learning_Flexibility') {
            // Map choices to CE/RO/AC/AE
            const contextRank: any = {
                context_name: item.category || item.stem, // Fallback to stem if category missing
                CE: 0, RO: 0, AC: 0, AE: 0
            };

            item.options.forEach((opt: AssessmentItemOption) => {
                const rank = itemAnswers[opt.id];
                if (rank) {
                    const modeMap: Record<string, string> = {
                        "Concrete Experience": "CE",
                        "Reflective Observation": "RO",
                        "Abstract Conceptualization": "AC",
                        "Active Experimentation": "AE"
                    };

                    const key = modeMap[opt.learning_mode] || opt.learning_mode;
                    if (['CE', 'RO', 'AC', 'AE'].includes(key)) {
                        contextRank[key] = rank;
                    }
                }
            });

            payload.contexts.push(contextRank as ContextRank);
        }
    });

    return payload;
};

const ActiveExperimentationRoom: React.FC = () => {
    const navigate = useNavigate();
    const [sessionId, setSessionId] = useState<number | null>(null);
    const [items, setItems] = useState<AssessmentItem[]>([]);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [completed, setCompleted] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [retryAction, setRetryAction] = useState<(() => void) | null>(null);
    const [isUnauthorized, setIsUnauthorized] = useState(false);

    const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
    // answers: itemId -> { choiceId -> rank }
    const [answers, setAnswers] = useState<Record<number, Record<number, number>>>({});
    const [direction, setDirection] = useState(0);

    const titleRef = useRef<HTMLHeadingElement>(null);
    useRoomFocus(titleRef);

    const initSession = async () => {
        try {
            setLoading(true);
            setError(null);
            setIsUnauthorized(false);

            // Start a new session
            const { session_id } = await api.startSession();
            setSessionId(session_id);

            // Fetch items
            const fetchedItems = await api.getSessionItems(session_id);
            setItems(fetchedItems);
        } catch (err: any) {
            if (err instanceof ApiError && err.isUnauthorized) {
                setIsUnauthorized(true);
                setError("You must be signed in to start an assessment.");
                setRetryAction(null); // No retry for auth errors
            } else {
                console.error("Failed to initialize session:", err);
                setError("Failed to load assessment. Please check your connection.");
                setRetryAction(() => initSession);
            }
        } finally {
            setLoading(false);
        }
      });
      
      currentItemAnswers[choiceId] = rank;
      return {
        ...prev,
        [currentQuestion.id]: currentItemAnswers
      };
    });
  };

  const isCurrentQuestionComplete = () => {
    if (!currentQuestion) return false;
    const currentItemAnswers = answers[currentQuestion.id] || {};
    const validation = validateContextRanks(currentItemAnswers);
    return validation.isValid;
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setDirection(1);
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      handleSubmit();
    }
  };

    if (loading) {
        return (
            <PageShell>
                <RoomContent>
                    <div className="flex items-center justify-center h-full">
                        <BodyText>Loading assessment...</BodyText>
                    </div>
                </RoomContent>
            </PageShell>
        );
    }

    if (error) {
        return (
            <PageShell>
                <RoomContent>
                    <div className="flex flex-col items-center justify-center h-full gap-4">
                        {isUnauthorized ? (
                            <AuthNotice
                                message="Sign in to start and save your assessment."
                                onActionClick={() => navigate(LOGIN_ROUTE)}
                            />
                        ) : (
                            <>
                                <BodyText className="text-red-400">{error}</BodyText>
                                {retryAction ? (
                                    <button
                                        onClick={() => {
                                            setError(null);
                                            retryAction();
                                        }}
                                        className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        Retry
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => window.location.reload()}
                                        className="px-6 py-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"
                                    >
                                        Reload Page
                                    </button>
                                )}
                            </>
                        )}
                    </div>
                </RoomContent>
            </PageShell>
        );
    }

    if (completed) {
        return (
            <PageShell>
                <RoomContent>
                    <motion.div
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="flex flex-col items-center justify-center h-full gap-8 max-w-2xl mx-auto text-center"
                    >
                        <DisplayTitle>Assessment Completed!</DisplayTitle>
                        <BodyText>
                            Your responses have been recorded. You can now view your learning style profile.
                        </BodyText>
                        <button
                            onClick={() => navigate(`/report/${sessionId}`)}
                            className="px-8 py-3 bg-amber-500 text-black font-bold rounded-full hover:bg-amber-400 transition-colors shadow-lg shadow-amber-500/20"
                        >
                            View Results
                        </button>
                    </motion.div>
                </RoomContent>
            </PageShell>
        );
    }

    return (
        <PageShell>
            <RoomContent>
                <motion.div
                    variants={staggerContainer}
                    initial="hidden"
                    animate="visible"
                    className="w-full max-w-3xl flex flex-col items-center gap-8"
                >
                    <div className="text-center max-w-2xl outline-none" ref={titleRef} tabIndex={-1}>
                        <DisplayTitle variants={fadeInUp}>Active Experimentation</DisplayTitle>
                        <BodyText tone="muted" className="mt-4" variants={fadeInUp}>
                            Rank the endings for each sentence (1 = Least like you, 4 = Most like you).
                        </BodyText>
                    </div>

                    {/* Render LFI Context Card or Standard Question */}
                    {currentQuestion.type === 'Learning_Flexibility' ? (
                      <LFIContextCard
                        contextName={currentQuestion.category || currentQuestion.stem}
                        stem={currentQuestion.stem}
                        options={currentQuestion.options}
                        currentRanks={answers[currentQuestion.id] || {}}
                        onRankChange={handleRank}
                      />
                    ) : (
                      <>
                        <h3 className="text-xl md:text-2xl font-bold text-white leading-tight">
                          {currentQuestion.stem}
                        </h3>

                        <div className="flex flex-col gap-4">
                          {currentQuestion.options.map((option) => {
                            const currentRank = answers[currentQuestion.id]?.[option.id];
                            return (
                              <div key={option.id} className="flex items-center gap-4 bg-white/5 p-4 rounded-lg border border-white/10">
                                <div className="flex gap-2">
                                  {[1, 2, 3, 4].map(rank => (
                                    <button
                                      key={rank}
                                      onClick={() => handleRank(option.id, rank)}
                                      className={`w-8 h-8 rounded-full border flex items-center justify-center transition-all ${
                                        currentRank === rank
                                          ? 'bg-amber-500 border-amber-500 text-black font-bold'
                                          : 'border-white/20 text-white/50 hover:border-white/50 hover:text-white'
                                      }`}
                                    >
                                      {rank}
                                    </button>
                                  ))}
                                </div>
                                <span className="text-lg text-white/90">{option.text}</span>
                              </div>
                            );
                          })}
                        </div>
                      </>
                    )}

                                        <div className="mt-auto flex justify-between items-center pt-4 border-t border-white/10">
                                            <button
                                                onClick={handlePrev}
                                                disabled={currentQuestionIndex === 0 || submitting}
                                                className="px-6 py-2 rounded-full text-white/60 hover:text-white disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                                            >
                                                Previous
                                            </button>

                                            <button
                                                onClick={handleNext}
                                                disabled={!isCurrentQuestionComplete() || submitting}
                                                className={`px-8 py-2 rounded-full font-semibold transition-all ${isCurrentQuestionComplete() && !submitting
                                                        ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20'
                                                        : 'bg-white/10 text-white/30 cursor-not-allowed'
                                                    }`}
                                            >
                                                {submitting ? 'Submitting...' : (currentQuestionIndex === totalQuestions - 1 ? 'Finish' : 'Next')}
                                            </button>
                                        </div>
                                    </GlassMaterial>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </motion.div>
            </RoomContent>
        </PageShell>
    );
};

export default ActiveExperimentationRoom;