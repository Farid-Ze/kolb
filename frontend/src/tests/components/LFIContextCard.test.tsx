import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { LFIContextCard } from '../../components/assessment/LFIContextCard';
import type { AssessmentItemOption } from '../../core/api/client';

describe('LFIContextCard', () => {
  const mockOptions: AssessmentItemOption[] = [
    { id: 1, learning_mode: 'Concrete Experience', text: 'By feeling' },
    { id: 2, learning_mode: 'Reflective Observation', text: 'By watching' },
    { id: 3, learning_mode: 'Abstract Conceptualization', text: 'By thinking' },
    { id: 4, learning_mode: 'Active Experimentation', text: 'By doing' },
  ];

  it('should render context name and description', () => {
    const onRankChange = vi.fn();
    
    render(
      <LFIContextCard
        contextName="Starting_Something_New"
        stem="When I start something new..."
        options={mockOptions}
        currentRanks={{}}
        onRankChange={onRankChange}
      />
    );

    expect(screen.getByText('Starting Something New')).toBeInTheDocument();
    expect(screen.getByText(/How you approach initiating/)).toBeInTheDocument();
  });

  it('should render all learning mode options', () => {
    const onRankChange = vi.fn();
    
    render(
      <LFIContextCard
        contextName="Starting_Something_New"
        stem="When I start something new..."
        options={mockOptions}
        currentRanks={{}}
        onRankChange={onRankChange}
      />
    );

    expect(screen.getByText(/CE - Feeling/)).toBeInTheDocument();
    expect(screen.getByText(/RO - Watching/)).toBeInTheDocument();
    expect(screen.getByText(/AC - Thinking/)).toBeInTheDocument();
    expect(screen.getByText(/AE - Doing/)).toBeInTheDocument();
  });

  it('should call onRankChange when rank button is clicked', () => {
    const onRankChange = vi.fn();
    
    render(
      <LFIContextCard
        contextName="Starting_Something_New"
        stem="When I start something new..."
        options={mockOptions}
        currentRanks={{}}
        onRankChange={onRankChange}
      />
    );

    const rankButtons = screen.getAllByRole('button', { name: /Rank 1/ });
    fireEvent.click(rankButtons[0]);

    expect(onRankChange).toHaveBeenCalledWith(1, 1);
  });

  it('should show validation error when incomplete', () => {
    const onRankChange = vi.fn();
    
    render(
      <LFIContextCard
        contextName="Starting_Something_New"
        stem="When I start something new..."
        options={mockOptions}
        currentRanks={{ 1: 1, 2: 2 }}
        onRankChange={onRankChange}
      />
    );

    expect(screen.getByText(/Incomplete Ranking/)).toBeInTheDocument();
    expect(screen.getByText(/All four learning modes must be ranked/)).toBeInTheDocument();
  });

  it('should show validation error for duplicate ranks', () => {
    const onRankChange = vi.fn();
    
    render(
      <LFIContextCard
        contextName="Starting_Something_New"
        stem="When I start something new..."
        options={mockOptions}
        currentRanks={{ 1: 1, 2: 1, 3: 2, 4: 3 }}
        onRankChange={onRankChange}
      />
    );

    expect(screen.getByText(/Each rank \(1-4\) must be used exactly once/)).toBeInTheDocument();
  });

  it('should show success message when ranking is complete', () => {
    const onRankChange = vi.fn();
    
    render(
      <LFIContextCard
        contextName="Starting_Something_New"
        stem="When I start something new..."
        options={mockOptions}
        currentRanks={{ 1: 1, 2: 2, 3: 3, 4: 4 }}
        onRankChange={onRankChange}
      />
    );

    expect(screen.getByText(/Context ranking complete!/)).toBeInTheDocument();
  });

  it('should disable rank buttons that are already used by other options', () => {
    const onRankChange = vi.fn();
    
    render(
      <LFIContextCard
        contextName="Starting_Something_New"
        stem="When I start something new..."
        options={mockOptions}
        currentRanks={{ 1: 1, 2: 2 }}
        onRankChange={onRankChange}
      />
    );

    // Find the rank 1 button for option 2 (should be disabled since option 1 has rank 1)
    const allRank1Buttons = screen.getAllByRole('button', { name: /Rank 1/ });
    // Second button should be disabled
    expect(allRank1Buttons[1]).toBeDisabled();
  });
});
