import type Konva from "konva";
import { StoreType } from "leva/dist/declarations/src/types";
import { ReactNode } from "react";
import { Object3D } from "three";

export const randomColor = () => "#" + ("00000" + ((Math.random() * 0x1000000) << 0).toString(16)).substr(-6);

export const getFileName = (path: string = "") => {
  const lastIndex = path.lastIndexOf("/") == -1 ? path.lastIndexOf("\\") : path.lastIndexOf("/");
  const filename = path.substring(lastIndex + 1);

  return filename.substring(0, filename.lastIndexOf("."));
};

const colormap: Record<string, string> = {};

export const getColor = (name: string) => {
  let color = colormap[name];
  if (!color) {
    color = randomColor();
    colormap[name] = color;
  }
  return color;
};

export function isObjectVisible(object: Object3D) {
  for (let obj = object; obj; obj = obj.parent) {
    if (!obj.visible) return false;
  }
  return true;
}

export const jsonFetcher = (...args: Parameters<typeof fetch>) => fetch(...args).then((res) => res.json());

export function renderRecord(record: Record<string, any>) {
  const nodes: ReactNode[] = [];
  for (const key in record) {
    nodes.push(
      <span key={key}>
        {key}: {record[key]}
      </span>
    );
  }
  return nodes;
}

export const inside = (x: number, lb: number, ub: number) => lb <= x && x <= ub;

export function zoom(stage: Konva.Stage, newScale: number, focus: Konva.Vector2d, store?: StoreType) {
  const oldScale = stage.scaleX();
  const mousePointTo = {
    x: (focus.x - stage.x()) / oldScale,
    y: (focus.y - stage.y()) / oldScale
  };
  const newPos = {
    x: focus.x - mousePointTo.x * newScale,
    y: focus.y - mousePointTo.y * newScale
  };
  stage.position(newPos);
  store && store.setValueAtPath("scale", newScale, false);
}
