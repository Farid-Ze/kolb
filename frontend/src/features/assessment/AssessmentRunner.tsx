import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAssessmentSession } from './hooks/useAssessmentSession';
import { useAssessmentTelemetry } from './hooks/useAssessmentTelemetry';

export function AssessmentRunner() {
    const { sessionId } = useParams();
    const navigate = useNavigate();
    const { items, isLoading, saveResponse, isSaving } = useAssessmentSession(sessionId);
    const [currentIndex, setCurrentIndex] = useState(0);
    // const [responses, setResponses] = useState<Record<number, any>>({}); // Unused for now

    const currentItem = items?.[currentIndex];
    const { recordTelemetry } = useAssessmentTelemetry(sessionId ? parseInt(sessionId) : undefined, currentItem?.id);

    if (isLoading) {
        return <div className="p-8 text-center">Loading assessment...</div>;
    }

    if (!items || items.length === 0) {
        return <div className="p-8 text-center">No items found for this session.</div>;
    }

    const isLastItem = currentIndex === items.length - 1;

    const handleNext = () => {
        if (isLastItem) {
            navigate(`/results/${sessionId}`);
        } else {
            setCurrentIndex(prev => prev + 1);
        }
    };

    const handlePrevious = () => {
        setCurrentIndex(prev => Math.max(0, prev - 1));
    };

    const handleResponse = (value: any) => {
        // setResponses(prev => ({ ...prev, [currentItem.id]: value }));
        saveResponse({
            item_id: currentItem.id,
            response_data: value
        } as any);

        recordTelemetry(1);
    };

    return (
        <div className="max-w-2xl mx-auto p-6">
            <div className="mb-6 flex justify-between items-center">
                <h2 className="text-xl font-bold">Question {currentIndex + 1} of {items.length}</h2>
                <span className="text-sm text-gray-500">{isSaving ? 'Saving...' : 'Saved'}</span>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm border mb-6">
                <h3 className="text-lg mb-4">{currentItem.prompt || currentItem.text || 'Question Text'}</h3>

                <div className="space-y-2">
                    <div className="p-4 border rounded hover:bg-gray-50 cursor-pointer" onClick={() => handleResponse({ rank: 1 })}>
                        Option A (Click to select)
                    </div>
                </div>
            </div>

            <div className="flex justify-between">
                <button
                    onClick={handlePrevious}
                    disabled={currentIndex === 0}
                    className="px-4 py-2 rounded border disabled:opacity-50"
                >
                    Previous
                </button>
                <button
                    onClick={handleNext}
                    className="px-4 py-2 rounded bg-blue-600 text-white hover:bg-blue-700"
                >
                    {isLastItem ? 'Finish' : 'Next'}
                </button>
            </div>
        </div>
    );
}
