import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { EngineService } from '@/shared/api/generated';
import { KiteDiagram } from './components/KiteDiagram';
import { Button } from '@/shared/components/ui/button';

export function Results() {
    const { sessionId } = useParams();

    const { data: report, isLoading } = useQuery({
        queryKey: ['session', sessionId, 'report'],
        queryFn: () => EngineService.engineReportEngineSessionsSessionIdReportGet(parseInt(sessionId!)),
        enabled: !!sessionId,
    });

    if (isLoading) {
        return <div className="p-8 text-center">Generating report...</div>;
    }

    if (!report) {
        return <div className="p-8 text-center">Report not found.</div>;
    }

    // Safe access to report properties
    const styleName = report.style?.styleName || 'Unknown';
    const kiteData = report.visualization?.kiteCoordinates;
    const strengths = report.analytics?.strengths as string[] | undefined;
    const blindspots = report.analytics?.blindspots as string[] | undefined;

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                <h1 className="text-3xl font-bold">Your Learning Style Profile</h1>
                <p className="text-xl text-gray-600">
                    You are a <span className="font-bold text-blue-600">{styleName}</span> learner.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                <div className="bg-white p-6 rounded-lg shadow-sm border">
                    <h2 className="text-lg font-semibold mb-4">Learning Style Kite</h2>
                    <KiteDiagram data={kiteData} />
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-2">Key Strengths</h2>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {strengths?.map((strength, i) => (
                                <li key={i}>{strength}</li>
                            )) || <li>No strengths identified.</li>}
                        </ul>
                    </div>

                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-2">Development Areas</h2>
                        <ul className="list-disc list-inside space-y-1 text-gray-700">
                            {blindspots?.map((blindspot, i) => (
                                <li key={i}>{blindspot}</li>
                            )) || <li>No development areas identified.</li>}
                        </ul>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button onClick={() => window.print()}>Download Report (PDF)</Button>
            </div>
        </div>
    );
}
