import React, { useEffect, useId, useMemo, useState } from 'react';
import { useLocation, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, FileText, Printer } from 'lucide-react';

import { PageShell, RoomContent } from '../core/design-system/Layout';
import { GlassMaterial } from '../core/design-system/Materials';
import { DisplayTitle, BodyText, SectionTitle } from '../core/design-system/Typography';
import { fadeInUp, staggerContainer } from '../core/physics/motionPrimitives';
import { AuthNotice } from '../core/auth/AuthNotice';
import { useNonBlockingNavigate } from '../hooks/useNonBlockingNavigate';
import { useTelemetry } from '../hooks/useTelemetry';
import { useAuth } from '../contexts/useAuth';
import { getReport } from '../services/reportService';
import type { Report } from '../types/api';
import { NonDiagnosticNotice, ResponsibleUseFooter } from '../components/report/NonDiagnosticNotice';
import { ScoreDisplay } from '../components/report/ScoreDisplay';
import { LearningStyleChart } from '../components/report/LearningStyleChart';
import { KiteChart } from '../components/report/KiteChart';
import { FlexibilityChart } from '../components/report/FlexibilityChart';
import { EnhancedAnalyticsPanel } from '../components/report/EnhancedAnalyticsPanel';
import { LearningSpaceInsights } from '../components/report/LearningSpaceInsights';
import { SessionDesignList } from '../components/report/SessionDesignList';
import { StyleSummaryCard } from '../components/report/StyleSummaryCard';
import { NormInfoCard } from '../components/report/NormInfoCard';
import { AnalyticsMetaCard } from '../components/report/AnalyticsMetaCard';
import { InterpretationNotes } from '../components/report/InterpretationNotes';

const LoadingState = () => (
	<PageShell>
		<RoomContent>
			<div className="flex flex-col items-center justify-center min-h-[60vh] gap-2 text-center">
				<div className="w-12 h-12 border-4 border-muted/30 border-t-primary rounded-full animate-spin" />
				<p className="text-foreground">Memproses laporan...</p>
				<p className="text-muted-foreground">Memuat laporan gaya belajar</p>
			</div>
		</RoomContent>
	</PageShell>
);

interface ErrorCardProps {
	title?: string;
	message: string;
	onBack: () => void;
}

const ErrorCard: React.FC<ErrorCardProps> = ({ title = 'Error', message, onBack }) => (
	<PageShell>
		<RoomContent>
			<div className="flex flex-col items-center justify-center min-h-[60vh]">
				<GlassMaterial intensity="high" className="max-w-md w-full p-8 text-center space-y-4">
					<SectionTitle>{title}</SectionTitle>
					<BodyText className="text-muted-foreground">{message}</BodyText>
					<button
						onClick={onBack}
						className="mt-2 inline-flex items-center justify-center rounded-full border border-border/60 px-6 py-2 text-sm font-semibold text-foreground hover:bg-white/10"
					>
						Kembali ke Beranda
					</button>
				</GlassMaterial>
			</div>
		</RoomContent>
	</PageShell>
);

interface MinimalStateProps {
	normLabel: string;
}

const MinimalState: React.FC<MinimalStateProps> = ({ normLabel }) => (
	<div className="material-regular rounded-xl p-8 text-center space-y-3">
		<SectionTitle>Data gaya belajar belum tersedia</SectionTitle>
		<p className="text-muted-foreground">
			Sesi ini belum menghasilkan analisis lengkap. Mohon pastikan asesmen telah diselesaikan sepenuhnya.
		</p>
		<p className="text-sm text-foreground font-medium">
			Kelompok norm — {normLabel.replace('Norm: ', '')}
		</p>
	</div>
);

export const ReportPage: React.FC = () => {
	const { sessionId, reportId } = useParams<{ sessionId?: string; reportId?: string }>();
	const resolvedId = sessionId ?? reportId ?? '';
	const navigate = useNonBlockingNavigate();
	const location = useLocation();
	const { trackPageView } = useTelemetry();
	const { user } = useAuth();
	const noticeId = useId();
	const [report, setReport] = useState<Report | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [isUnauthorized, setIsUnauthorized] = useState(false);

	useEffect(() => {
		trackPageView(location.pathname, 'Report Page');
	}, [location.pathname, trackPageView]);

 	useEffect(() => {
		if (!resolvedId) {
			setLoading(false);
			setError('ID sesi tidak ditemukan');
			return;
		}

		let active = true;

		const fetchReport = async () => {
			try {
				setLoading(true);
				setError(null);
				setIsUnauthorized(false);
				const data = await getReport(resolvedId);
				if (!active) {
					return;
				}
				setReport(data);
			} catch (err) {
				if (!active) {
					return;
				}
				if (err instanceof Error && err.message.includes('401')) {
					setIsUnauthorized(true);
					setError(null);
				} else if (err instanceof Error && err.message.toLowerCase().includes('not found')) {
					setError('Laporan tidak ditemukan');
				} else if (err instanceof Error) {
					setError(err.message);
				} else {
					setError('Terjadi kesalahan tak terduga');
				}
			} finally {
				if (active) {
					setLoading(false);
				}
			}
		};

		void fetchReport();

		return () => {
			active = false;
		};
	}, [resolvedId]);

	const normLabel = useMemo(() => {
		const group = report?.percentiles?.norm_group_used ?? 'Tidak tersedia';
		const version = report?.percentiles?.norm_version_used;
		if (version) {
			return `Norm: ${group} (versi ${version})`;
		}
		return `Norm: ${group}`;
	}, [report?.percentiles?.norm_group_used, report?.percentiles?.norm_version_used]);

	if (!resolvedId) {
		return <ErrorCard message="ID sesi tidak ditemukan" onBack={() => navigate('/')} />;
	}

	if (loading) {
		return <LoadingState />;
	}

	if (isUnauthorized) {
		return (
			<PageShell>
				<RoomContent>
					<div className="flex items-center justify-center min-h-[60vh]">
						<AuthNotice
							title="Sesi memerlukan autentikasi"
							message="Silakan masuk kembali untuk melihat laporan ini"
							onActionClick={() => navigate('/auth/login')}
						/>
					</div>
				</RoomContent>
			</PageShell>
		);
	}

	if (error) {
		return <ErrorCard message={error} onBack={() => navigate('/reports')} />;
	}

	if (!report) {
		return <ErrorCard message="Laporan tidak tersedia" onBack={() => navigate('/reports')} />;
	}

	const minimalPayload = !report.raw && !report.percentiles && !report.style && !report.lfi;
	const showEnhancedAnalytics = user?.role === 'MEDIATOR';

	const handlePrint = () => {
		if (typeof window !== 'undefined' && typeof window.print === 'function') {
			window.print();
		}
	};

	const handleDownloadPdf = () => {
		// For now, we leverage the browser's print-to-PDF capability which is robust
		// thanks to our specific @media print styles.
		// In the future, we could use html2pdf.js or similar if client-side generation is strictly required.
		if (typeof window !== 'undefined' && typeof window.print === 'function') {
			window.print();
		}
	};

	return (
		<PageShell>
			<RoomContent>
				<motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
					<header className="space-y-4">
						<div className="flex flex-wrap items-center gap-3 print:hidden">
							<button
								onClick={() => navigate('/reports')}
								className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-foreground hover:bg-white/10 print:hidden"
							>
								<ArrowLeft className="h-4 w-4" />
								Kembali ke Beranda
							</button>
							<button
								onClick={handlePrint}
								aria-label="Cetak laporan"
								className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-foreground hover:bg-white/10"
							>
								<Printer className="h-4 w-4" />
								Cetak
							</button>
							<button
								onClick={handleDownloadPdf}
								aria-label="Unduh PDF laporan"
								className="inline-flex items-center gap-2 rounded-full border border-border/60 px-4 py-2 text-sm font-semibold text-foreground hover:bg-white/10"
							>
								<FileText className="h-4 w-4" />
								PDF
							</button>
						</div>

						<div>
							<DisplayTitle variants={fadeInUp}>Laporan Hasil Asesmen</DisplayTitle>
							<BodyText tone="muted" className="mt-2" variants={fadeInUp}>
								Ringkasan gaya belajar hasil KLSI 4.0 berikut bersifat formatif dan mendukung refleksi terarah.
							</BodyText>
							<p className="text-sm text-muted-foreground mt-2">{normLabel}</p>
						</div>
					</header>

					<NonDiagnosticNotice id={noticeId} message={report.responsibleUseNotice ?? undefined} />

					{minimalPayload ? (
						<MinimalState normLabel={normLabel} />
					) : (
						<div className="grid gap-8 lg:grid-cols-[2fr_1fr]">
							<section className="space-y-8">
								<ScoreDisplay raw={report.raw} percentiles={report.percentiles} />

								<LearningStyleChart
									visualization={report.visualization}
									style={report.style}
									ariaDescribedById={noticeId}
								/>

								<KiteChart kiteData={report.visualization?.kite} />

								{report.learningSpace && (
									<LearningSpaceInsights block={report.learningSpace} />
								)}

								{report.sessionDesigns?.length ? (
									<SessionDesignList items={report.sessionDesigns} />
								) : null}
							</section>

							<aside className="space-y-6">
								<StyleSummaryCard style={report.style} />
								<NormInfoCard percentiles={report.percentiles} />
								{report.lfi ? (
									<FlexibilityChart lfi={report.lfi} ariaDescribedById={noticeId} />
								) : null}
								{report.analytics?.meta ? (
									<AnalyticsMetaCard
										heuristic={report.analytics.meta.heuristic ?? false}
										note={report.analytics.meta.note ?? undefined}
									/>
								) : null}
								{report.notes ? <InterpretationNotes notes={report.notes} /> : null}
								<ResponsibleUseFooter />
								{showEnhancedAnalytics ? (
									<EnhancedAnalyticsPanel analytics={report.enhancedAnalytics} />
								) : null}
							</aside>
						</div>
					)}
				</motion.div>
			</RoomContent>
		</PageShell>
	);
};








