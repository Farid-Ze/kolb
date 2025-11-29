import { useNavigate } from 'react-router-dom';
import { useMutation } from '@tanstack/react-query';
import { SessionsService } from '@/shared/api/generated';
import { Button } from '@/shared/components/ui/button';
import { toast } from 'sonner';

export function AssessmentIntro() {
    const navigate = useNavigate();

    const startSessionMutation = useMutation({
        mutationFn: () => SessionsService.startSessionApiV1SessionsStartPost({ instrumentCode: 'KLSI', instrumentVersion: '4.0' }),
        onSuccess: (data) => {
            toast.success('Assessment started');
            navigate(`/assessment/${data.sessionId}`);
        },
        onError: (error) => {
            toast.error('Failed to start assessment');
            console.error(error);
        }
    });

    return (
        <div className="max-w-2xl mx-auto p-8 text-center space-y-6">
            <h1 className="text-3xl font-bold">Kolb Learning Style Inventory</h1>
            <p className="text-lg text-gray-600">
                Discover your unique learning style by answering 12 questions.
                There are no right or wrong answers.
            </p>

            <div className="bg-blue-50 p-6 rounded-lg text-left space-y-4">
                <h2 className="font-semibold text-blue-900">Instructions:</h2>
                <ul className="list-disc list-inside text-blue-800 space-y-2">
                    <li>Rank the endings for each sentence according to how well you think they fit how you learn.</li>
                    <li>4 = Most like you</li>
                    <li>1 = Least like you</li>
                </ul>
            </div>

            <Button
                size="lg"
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
            >
                {startSessionMutation.isPending ? 'Starting...' : 'Start Assessment'}
            </Button>
        </div>
    );
}
