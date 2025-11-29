import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ReportsService, type IndividualReportPayload } from '@/shared/api/generated';
import { KiteDiagram } from './components/KiteDiagram';
import { Button } from '@/shared/components/ui/button';

export function Results() {
    const { sessionId } = useParams();

    const { data: report, isLoading } = useQuery({
        queryKey: ['session', sessionId, 'report'],
        queryFn: () => ReportsService.getReportApiV1ReportsSessionIdGet(sessionId!),
        enabled: !!sessionId,
    });

    if (isLoading) {
        return (
            <div className="max-w-4xl mx-auto p-6 space-y-8 animate-pulse">
                <div className="text-center space-y-4">
                    <div className="h-10 bg-gray-200 rounded w-3/4 mx-auto"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/2 mx-auto"></div>
                </div>

                <div className="grid md:grid-cols-2 gap-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm border h-96">
                        <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                        <div className="h-full bg-gray-100 rounded"></div>
                    </div>

                    <div className="space-y-6">
                        <div className="bg-white p-6 rounded-lg shadow-sm border h-48">
                            <div className="h-6 bg-gray-200 rounded w-1/4 mb-4"></div>
                            <div className="space-y-2">
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    if (!report) {
        return <div className="p-8 text-center">Report not found.</div>;
    }

    if ('members' in report) {
        return <div className="p-8 text-center">Team reports are not supported in this view.</div>;
    }

    const individualReport = report as IndividualReportPayload;

    // Safe access to report properties
    const styleName = individualReport.style?.styleName || 'Unknown';

    // Map raw scores to KiteDiagram format
    const rawScores = individualReport.analytics?.rawScores || {};
    const kiteData = {
        AC: rawScores['AC'] || 0,
        CE: rawScores['CE'] || 0,
        AE: rawScores['AE'] || 0,
        RO: rawScores['RO'] || 0,
    };

    return (
        <div className="max-w-4xl mx-auto p-6 space-y-8">
            <div className="text-center space-y-4">
                {/* [IMPLEMENTASI BARU] Menambahkan viewTransitionName pada Judul */}
                <h1
                    className="text-3xl font-bold"
                    style={{ viewTransitionName: 'page-title' } as React.CSSProperties}
                >
                    Your Learning Style Profile
                </h1>
                <p className="text-xl text-gray-600">
                    You are a <span className="font-bold text-blue-600">{styleName}</span> learner.
                </p>
            </div>

            <div className="grid md:grid-cols-2 gap-8">
                {/* [IMPLEMENTASI BARU] Menambahkan viewTransitionName pada Kartu Utama */}
                <div
                    className="bg-white p-6 rounded-lg shadow-sm border"
                    style={{ viewTransitionName: 'card-morph' } as React.CSSProperties}
                >
                    <h2 className="text-lg font-semibold mb-4">Learning Style Kite</h2>
                    <KiteDiagram data={kiteData} />
                </div>

                <div className="space-y-6">
                    <div className="bg-white p-6 rounded-lg shadow-sm border">
                        <h2 className="text-lg font-semibold mb-2">Analytics</h2>
                        <p className="text-gray-600">Detailed analytics coming soon.</p>
                    </div>
                </div>
            </div>

            <div className="flex justify-center pt-8">
                <Button onClick={() => window.print()}>Download Report (PDF)</Button>
            </div>
        </div>
    );
}
