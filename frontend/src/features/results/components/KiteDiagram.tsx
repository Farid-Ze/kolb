import { ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend } from 'recharts';

interface KiteDiagramProps {
    data: {
        AC: number;
        CE: number;
        AE: number;
        RO: number;
    } | null | undefined;
}

export function KiteDiagram({ data }: KiteDiagramProps) {
    if (!data) return <div className="h-64 flex items-center justify-center bg-gray-50 rounded">No data available</div>;

    // Transform data for Radar Chart
    // Recharts Radar expects an array of objects
    const chartData = [
        { subject: 'AC (Abstract Conceptualization)', A: data.AC, fullMark: 40 },
        { subject: 'AE (Active Experimentation)', A: data.AE, fullMark: 40 },
        { subject: 'CE (Concrete Experience)', A: data.CE, fullMark: 40 },
        { subject: 'RO (Reflective Observation)', A: data.RO, fullMark: 40 },
    ];

    return (
        <div className="w-full h-96">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={chartData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="subject" />
                    <PolarRadiusAxis angle={30} domain={[0, 40]} />
                    <Radar
                        name="Learning Style"
                        dataKey="A"
                        stroke="#8884d8"
                        fill="#8884d8"
                        fillOpacity={0.6}
                    />
                    <Legend />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
}
