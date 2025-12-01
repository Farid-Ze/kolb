/* generated using openapi-typescript-codegen -- do not edit */
/* istanbul ignore file */
/* tslint:disable */
/* eslint-disable */
export type ScorePreviewRaw = {
    /**
     * Concrete Experience raw score (12-48)
     */
    ce: number;
    /**
     * Reflective Observation raw score (12-48)
     */
    ro: number;
    /**
     * Abstract Conceptualization raw score (12-48)
     */
    ac: number;
    /**
     * Active Experimentation raw score (12-48)
     */
    ae: number;
    /**
     * AC-CE dialectic score (-36 to +36)
     */
    acce: number;
    /**
     * AE-RO dialectic score (-36 to +36)
     */
    aero: number;
    /**
     * Accommodating-Assimilating dimension (AC+RO) - (AE+CE)
     */
    accAssm: number;
    /**
     * Inverse of acc_assm
     */
    accomMinusAssim: number;
    /**
     * Converging-Diverging dimension (AC+AE) - (CE+RO). Positive = Converging, Negative = Diverging.
     */
    convDiv: number;
};

