import { getColor, getFileName } from "@/utils/misc";
import create from "zustand";
import { combine } from "zustand/middleware";
import { immer } from "./types";

export interface IObject {
  path: string;
  url: string;
  name: string;
  color: string;
  visible: boolean;
  select: false;
  preserved?: boolean;
}

export type OBJECT_TYPE = "meshes" | "point_clouds" | "boxes" | "camera_trajectories" | "images" | "lines" | "voxels" | "spheres" | "correspondences" | "planes";

export type IObjectDict = {
  [key in OBJECT_TYPE]?: IObject[];
};

export const useObjectStore = create(
  combine(
    { objDict: {} as IObjectDict },
    immer((set) => ({
      set,
      loadObjects(objects: Map<string, string[]>, baseUrl: string, preserve: boolean) {
        set((state) => {
          const objDict: IObjectDict = {};
          for (const key in objects) {
            objDict[key] = objects[key].map((path: string) => {
              const name = getFileName(path);
              return {
                path,
                url: `${baseUrl}/file?path=${encodeURIComponent(path)}`,
                name,
                visible: true,
                select: false,
                color: getColor(name),
                preserved: false
              };
            });
          }
          for (const key in state.objDict) {
            const newArr = (objDict[key] = objDict[key] || []) as IObject[];
            for (const obj of state.objDict[key] as IObject[]) {
              const idx = newArr.findIndex((_obj) => _obj.name === obj.name);
              if (idx === -1) {
                preserve && newArr.unshift({ ...obj, preserved: true });
              } else {
                newArr[idx].visible = obj.visible;
              }
            }
          }
          state.objDict = objDict;
        });
      }
    }))
  )
);

export const objectState = useObjectStore.getState();

export const objectSelector = (state: typeof objectState) => state.objDict;
