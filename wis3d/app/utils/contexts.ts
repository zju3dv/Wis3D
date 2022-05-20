import { createContext, MutableRefObject } from "react";
import type { TrackballControls } from "three/examples/jsm/controls/TrackballControls";
import type { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export const ControlsRefContext = createContext<
  MutableRefObject<TrackballControls | OrbitControls>
>(undefined);
export const PropertyDockerRefContext = createContext<MutableRefObject<HTMLDivElement>>(undefined);
