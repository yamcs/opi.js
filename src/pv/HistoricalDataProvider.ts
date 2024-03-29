import { NullablePoint } from "../positioning";

export interface HistoricalDataProvider {

    /**
     * Get samples for a parameter. This will be merged with the realtime data of a widget that supports it.
     * This method is called very often. Any time management is to be handled outside of this library.
     */
    getSamples(): NullablePoint[];

    disconnect(): void;
}
