import { State, GetState, StoreApi, SetState } from "zustand";
import produce, { enableMapSet } from "immer";

enableMapSet();

export type ImmerPartialState<T extends State> = (state: T) => Partial<T> | void;

export type ImmerSetState<T extends State> = (partial: ImmerPartialState<T>) => void;

export type ImmerStateCreator<PrimaryState extends State, SecondaryState extends State> = (
  set: ImmerSetState<PrimaryState>,
  get: GetState<PrimaryState>,
  api: StoreApi<PrimaryState>
) => (PrimaryState & SecondaryState) | SecondaryState;

export function immer<PrimaryState extends State, SecondaryState extends State>(
  create: ImmerStateCreator<PrimaryState, SecondaryState>
) {
  return (set: SetState<PrimaryState>, get: GetState<PrimaryState>, api: StoreApi<PrimaryState>) =>
    create((fn) => set(produce(fn) as any), get, api);
}
