import { useQuery } from '@tanstack/react-query';
import { SessionsService } from '@/shared/api/generated';
import { Link } from 'react-router-dom';
import { Button } from '@/shared/components/ui/button';
import { useAuth } from '@/features/auth/useAuth';

export function Dashboard() {
    const { user } = useAuth();

    const { data: sessions, isLoading } = useQuery({
        queryKey: ['sessions'],
        queryFn: () => SessionsService.listSessionsApiV1SessionsGet(),
    });

    return (
        <div className="max-w-5xl mx-auto p-6">
            <div className="flex justify-between items-center mb-8">
                <div>
                    <h1 className="text-2xl font-bold">Welcome, {user?.fullName || 'Guest'}</h1>
                    <p className="text-gray-600">Manage your assessments and view reports.</p>
                </div>
                <Link to="/assessment">
                    <Button>Start New Assessment</Button>
                </Link>
            </div>

            <div className="bg-white rounded-lg shadow-sm border">
                <div className="p-6 border-b">
                    <h2 className="text-lg font-semibold">Recent Sessions</h2>
                </div>

                {isLoading ? (
                    <div className="p-8 text-center text-gray-500">Loading sessions...</div>
                ) : sessions?.length === 0 ? (
                    <div className="p-12 text-center text-gray-500">
                        <p className="mb-4">You haven't taken any assessments yet.</p>
                        <Link to="/assessment">
                            <Button variant="outline">Take Assessment</Button>
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y">
                        {sessions?.map((session) => (
                            <div key={session.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                                <div>
                                    <div className="font-medium">
                                        Assessment {new Date(session.startTime).toLocaleDateString()}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                        Status: <span className="capitalize">{session.status}</span>
                                    </div>
                                </div>
                                <div className="flex gap-3">
                                    {session.status === 'completed' ? (
                                        <Link to={`/results/${session.id}`}>
                                            <Button variant="outline" size="sm">View Report</Button>
                                        </Link>
                                    ) : (
                                        <Link to={`/assessment/${session.id}`}>
                                            <Button size="sm">Continue</Button>
                                        </Link>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
