import React from 'react';
import { SectionTitle } from '../../core/design-system/Typography';
import type { ReportNotes } from '../../types/api';

interface InterpretationNotesProps {
  notes: ReportNotes;
}

export const InterpretationNotes: React.FC<InterpretationNotesProps> = ({ notes }) => (
  <div className="material-regular rounded-xl p-6 space-y-3">
    <SectionTitle>Catatan Interpretasi</SectionTitle>
    {notes.acc_assm_definition && (
      <p className="text-sm text-foreground">Definisi ACC-ASSM: {notes.acc_assm_definition}</p>
    )}
    {notes.balance_definition && (
      <p className="text-sm text-foreground">Definisi BAL: {notes.balance_definition}</p>
    )}
    {notes.interpretation_summary && (
      <p className="text-sm text-muted-foreground">{notes.interpretation_summary}</p>
    )}
  </div>
);
