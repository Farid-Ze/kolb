import React from 'react';
import { SectionTitle } from '../../core/design-system/Typography';
import type { LearningSpaceBlock } from '../../types/api';

interface LearningSpaceInsightsProps {
  block: LearningSpaceBlock;
}

export const LearningSpaceInsights: React.FC<LearningSpaceInsightsProps> = ({ block }) => (
  <div className="material-regular rounded-xl p-6 space-y-4">
    <SectionTitle>Learning Space Insights</SectionTitle>
    {block.development?.spiral_stage && (
      <div>
        <p className="text-xs uppercase text-muted-foreground">Spiral Stage</p>
        <p className="text-lg text-foreground">{block.development.spiral_stage}</p>
        {block.development.label && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-secondary/50">{block.development.label}</span>
        )}
      </div>
    )}
    {block.educator_roles?.length ? (
      <div>
        <p className="text-xs uppercase text-muted-foreground">Peran fasilitator</p>
        <ul className="list-disc list-inside text-sm text-foreground">
          {block.educator_roles.map((role, index) => (
            <li key={`${role.role ?? 'role'}-${index}`}>
              <strong>{role.role}</strong> — {role.focus}
            </li>
          ))}
        </ul>
      </div>
    ) : null}
    {block.suggestions?.items?.length ? (
      <div>
        <p className="text-xs uppercase text-muted-foreground">Heuristik</p>
        <ul className="list-disc list-inside text-sm text-foreground">
          {block.suggestions.items.map((suggestion) => (
            <li key={suggestion}>{suggestion}</li>
          ))}
        </ul>
      </div>
    ) : null}
  </div>
);
