import { memo, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useHotkeys } from "react-hotkeys-hook";
import { useBoolean } from "@fluentui/react-hooks";
import { Image, Layer, Stage, Circle } from "react-konva/lib/ReactKonvaCore";
import type Konva from "konva";
import "konva/lib/shapes/Image";
import "konva/lib/shapes/Line";
import "konva/lib/shapes/Circle";
import createColormap from "colormap";
import colorScale from "colormap/colorScale";
import interpolate from "color-interpolate";
import { useControls, LevaInputs, buttonGroup } from "leva";
import { Schema, StoreType, ButtonGroupInput } from "leva/dist/declarations/src/types";
import { useImages, useXHR } from "@/utils/hooks";
import { theme } from "@/utils/theme";
import { inside, zoom } from "@/utils/misc";
import { LineSegment } from "./line-segment";
import { MetaView } from "../react/meta-view";
import { KeypointInfoView } from "../react/keypoint-info-view";
import { EditFuncBodyModal } from "../react/edit-func-body-modal";

interface IProps {
  url: string;
  store: StoreType;
}

interface IFilter {
  enabled: boolean;
  inverted: boolean;
}

const defaultCorr = {
  img0: "",
  img1: "",
  kpts0: [] as [number, number][],
  kpts1: [] as [number, number][],
  unmatched_kpts0: [] as [number, number][],
  unmatched_kpts1: [] as [number, number][],
  metrics: {} as Record<string, number[]>,
  booleans: {} as Record<string, boolean[]>,
  meta: {} as Record<string, any>
};

const defaultAppr = {
  width: 0,
  height: 0,
  scaleToFit: 1,
  offsetTop: 0,
  offsetLeft: 0
};

const stageStyle = {
  width: "100%",
  height: "100%",
  display: "flex",
  alignItems: "center",
  background: theme.palette.neutralSecondary
};
const indentStyle = { paddingLeft: 16 };
const defaultColorFuncBody: string = JSON.parse(localStorage.getItem("colorFuncBody")) ?? "return palette(val / max);";
const colormapNames = Object.keys(colorScale);

const defaultColorFunc = (palette: (i: number) => string, min: number, max: number, val: number, i: number) => {
  return palette(val / max);
};

export const Correspondence = memo<IProps>(function Correspondence(props) {
  const { url, store } = props;
  const {
    img0,
    img1,
    kpts0,
    kpts1,
    unmatched_kpts0 = [],
    unmatched_kpts1 = [],
    metrics = {},
    booleans = {},
    meta = {}
  } = useXHR(url, "GET", "json", defaultCorr);
  const ref = useRef<Konva.Stage>();
  const updateScaleRef = useRef<(scale?: number, shouldSet?: boolean) => void>();
  const timeoutRef = useRef<number>();
  const [hidden, { setFalse: setHiddenFalse, setTrue: setHiddenTrue }] = useBoolean(true);
  const [isStatic, { setFalse: setStaticFalse, setTrue: setStaticTrue }] = useBoolean(true);
  const [{ width, height, offsetTop, offsetLeft }, setAppearance] = useState(defaultAppr);
  const [hoveredIndex, setHoveredIndex] = useState<number>(undefined);
  const [dblClickedIndex, setDblClickedIndex] = useState<number>(undefined);
  const [colorFuncBody, setColorFuncBody] = useState(defaultColorFuncBody);
  const colorFunc = useMemo(() => Function("palette", "min", "max", "localMax", "val", "i", colorFuncBody), [colorFuncBody]);
  const [thresholds, setThresholds] = useState<Record<string, [number, number]>>({});
  const [filters, setFilters] = useState<Record<string, IFilter>>({});
  const [images, loaded] = useImages([img0, img1]);

  const onMouseEnter = useCallback((ev: Konva.KonvaEventObject<MouseEvent>) => {
    setHoveredIndex(ev.target.parent?.attrs.index);
  }, []);
  const onDblClick = useCallback((ev: Konva.KonvaEventObject<MouseEvent>) => {
    setDblClickedIndex(ev.target.parent?.attrs.index);
    ev.cancelBubble = true;
  }, []);
  const onWheel = useCallback(
    (ev: Konva.KonvaEventObject<WheelEvent>) => {
      ev.evt.preventDefault();
      const stage = ev.currentTarget.getStage();

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = undefined;
      }
      stage.container().style.cursor = ev.evt.deltaY < 0 ? "zoom-in" : "zoom-out";
      setStaticFalse();

      const scaleBy = 1.01;
      const oldScale = stage.scaleX();
      const isScalingUp = ev.evt.deltaY < 0;
      if ((isScalingUp && oldScale >= 3) || (!isScalingUp && oldScale <= 0.3)) return;

      let newScale = isScalingUp ? oldScale * scaleBy : oldScale / scaleBy;
      if (newScale > 3) newScale = 3;
      if (newScale < 0.3) newScale = 0.3;

      const pointer = stage.getPointerPosition();
      zoom(stage, newScale, pointer, store);

      timeoutRef.current = window.setTimeout(() => {
        setStaticTrue();
        stage.container().style.cursor = "default";
        timeoutRef.current = undefined;
      }, 150);
    },
    [store]
  );
  const onDragStart = useCallback((ev: Konva.KonvaEventObject<DragEvent>) => {
    setStaticFalse();
    ev.currentTarget.getStage().container().style.cursor = "move";
  }, []);
  const onDragEnd = useCallback((ev: Konva.KonvaEventObject<DragEvent>) => {
    setStaticTrue();
    ev.currentTarget.getStage().container().style.cursor = "default";
  }, []);
  const unselect = useCallback(() => {
    setDblClickedIndex(undefined);
    setHoveredIndex(undefined);
  }, []);

  useHotkeys("Escape", unselect);
  useEffect(unselect, [url]);

  useEffect(() => {
    if (!loaded) return;
    const container = ref.current.container();
    const onResize = () => {
      const [imgLeft, imgRight] = images;
      const imgWidth = imgLeft.width + imgRight.width;
      const imgHeight = Math.max(imgLeft.height, imgRight.height);
      const scaleToFit = Math.min(container.clientWidth / imgWidth, container.clientHeight / imgHeight);
      const offsetLeft = (container.clientWidth - scaleToFit * imgWidth) / 2;
      const offsetTop = (container.clientHeight - scaleToFit * imgHeight) / 2;
      setAppearance({
        width: container.clientWidth,
        height: container.clientHeight,
        scaleToFit,
        offsetLeft,
        offsetTop
      });

      updateScaleRef.current = (newScale?: number, shouldSet = true) => {
        const stage = ref.current;
        const oldScale = stage.scaleX();
        if (newScale) {
          const imgX = (oldScale * (imgWidth + offsetLeft * 2)) / 2;
          const imgY = (oldScale * (imgHeight + offsetTop * 2)) / 2;
          const pointer = { x: stage.x() + imgX, y: stage.y() + imgY };
          zoom(stage, newScale, pointer, shouldSet ? store : undefined);
        } else {
          store.setValueAtPath("scale", scaleToFit, false);
          stage.position({ x: 0, y: 0 });
        }
      };

      store.get("scale") === 1 && store.setValueAtPath("scale", scaleToFit, false);
    };
    onResize();
    const observer = new ResizeObserver(onResize);
    observer.observe(container);
    return () => {
      observer.unobserve(container);
      setHoveredIndex(undefined);
      setDblClickedIndex(undefined);
    };
  }, [loaded, store]);

  const { scale, strokeWidth, lineOpacity, pointOpacity, showUnmatchedKeypoints, showAllMatches } = useControls(
    {
      background: {
        hint: "background",
        value: (JSON.parse(localStorage.getItem("background")) as string) ?? theme.palette.neutralSecondary,
        onChange(val, path, ctx) {
          ref.current.container().style.background = val;
        }
      },
      scale: {
        hint: "scale",
        min: 0.3,
        max: 3,
        step: 0.01,
        value: 1,
        transient: false,
        onEditStart: setStaticFalse,
        onEditEnd: setStaticTrue,
        onChange(val, path, ctx) {
          if (!ctx.initial && ctx.fromPanel) {
            updateScaleRef.current(val, false);
          }
        }
      },
      " ": buttonGroup({
        opts: {
          reset: () => updateScaleRef.current(),
          "0.5x": () => updateScaleRef.current(0.5),
          "1.0x": () => updateScaleRef.current(1),
          "2.0x": () => updateScaleRef.current(2)
        }
      }),
      strokeWidth: {
        label: "stroke width (px)",
        hint: "stroke width (px)",
        min: 0.01,
        max: 5,
        step: 0.01,
        value: (JSON.parse(localStorage.getItem("strokeWidth")) as number) ?? 2
      },
      lineOpacity: {
        label: "line opacity",
        hint: "line opacity",
        min: 0,
        max: 1,
        step: 0.01,
        value: (JSON.parse(localStorage.getItem("lineOpacity")) as number) ?? 0.4
      },
      pointOpacity: {
        label: "point opacity",
        hint: "point opacity",
        min: 0,
        max: 1,
        step: 0.01,
        value: (JSON.parse(localStorage.getItem("pointOpacity")) as number) ?? 0.4
      },
      showUnmatchedKeypoints: {
        label: "show unmatched keypoints",
        hint: "show unmatched keypoints",
        value: (JSON.parse(localStorage.getItem("showUnmatchedKeypoints")) as boolean) ?? true
      },
      showAllMatches: {
        label: "show all matches",
        hint: "show all matches",
        value: (JSON.parse(localStorage.getItem("showAllMatches")) as boolean) ?? true
      }
    },
    { store }
  );

  const [metricNames, boolNames] = useMemo(() => [Object.keys(metrics), Object.keys(booleans)], [metrics, booleans]);
  useControls(
    () => {
      const config: Schema = {};
      for (const name of boolNames) {
        config[name] = {
          type: LevaInputs.BOOLEAN,
          label: name,
          hint: name,
          value: false,
          onChange(val, path, ctx) {
            setFilters((filters) => ({
              ...filters,
              [name]: { ...filters[name], enabled: val }
            }));
            unselect();
          }
        };
        config[name + "_inverted"] = {
          type: LevaInputs.BOOLEAN,
          label: <span style={indentStyle}>inverted</span>,
          value: false,
          render: (get) => get(name),
          onChange(val, path, ctx) {
            setFilters((filters) => ({
              ...filters,
              [name]: { ...filters[name], inverted: val }
            }));
          }
        };
      }
      return config;
    },
    { store },
    [ boolNames ]
  );

  const showMatchesOptions = ["customize func", "error color func"]
  const [{showMatchesBy = ""}] = useControls(
    () => {
      const config: Schema = {};
      const names = Object.keys(metrics);
      if (names.length) {
        config["showMatchesBy"] = {
          type: LevaInputs.SELECT,
          label: "show matches by",
          options: showMatchesOptions,
          value: (JSON.parse(localStorage.getItem("showMatchesBy")) as string) ?? showMatchesOptions[0]
        }
      }
      return config
    },
    { store },
    [ metrics ]
  )

  const [{ thr }] = useControls(
    () => {
      const config: Schema = {};
      if(showMatchesBy == showMatchesOptions[1]) {
        config["thr"] = {
          label: "thresholds",
          hint: "thresholds",
          min: 0,
          max: 50,
          value: (JSON.parse(localStorage.getItem("thr")) as number) ?? 5,
          step: 0.1
        }
      }
      return config;
    },
    { store },
    [ showMatchesBy ]
  )

  const [{ colormap, colorFuncBodyControl, metricName = "",  ...allMetrics}, setMetrics] = useControls(
    () => {
      const config: Schema = {};
      const names = Object.keys(metrics);
      if (showMatchesBy == showMatchesOptions[0]) {
        config["colormap"] = {
          hint: "colormap",
          options: colormapNames,
          value: (JSON.parse(localStorage.getItem("colormap")) as string) ?? colormapNames[0]
        };
        config["colorFuncBodyControl"] = buttonGroup({
          label: "color func",
          opts: { edit: setHiddenFalse }
        })
      }
      if (names.length) {
        config["metricName"] = {
          type: LevaInputs.SELECT,
          label: "colored by",
          options: names,
          value: names[0]
        }
        if (!showAllMatches && showMatchesBy == showMatchesOptions[0]) {
          for (const name in metrics) {
            const min = Math.min(...metrics[name]);
            const max = Math.max(...metrics[name]);
            config[name] = {
              label: name,
              hint: name,
              min: min,
              max: max,
              value: [min, max],
              onEditEnd(val, path, ctx) {
                setThresholds((metrics) => ({ ...metrics, [path]: val }));
                unselect();
              }
            };
          }
        }
      } 
      return config;
    },
    { store },
    [metrics, showAllMatches, showMatchesBy]
  )

  const getMetricData = (name: string) => {
    setThresholds((metrics) => ({ ...metrics, [name]: allMetrics[name] as any }));
    unselect();
  }

  useEffect(() => {
    const names = Object.keys(metrics);
    if(names.length) {
      setMetrics({ metricName: names[0] });
      if(!showAllMatches && showMatchesBy == showMatchesOptions[0]) {
        for (const name in allMetrics) {
          setMetrics({
            [name]: getMetricData(name)
          })
          setMetrics({
            [name]: getMetricData(name)
          })
        }
      }
    }
  }, [metrics, showAllMatches, showMatchesBy]);


  const points = useMemo(() => {
    if (!loaded) return [];
    return kpts0.map((kpt, i) => [kpt[0], kpt[1], kpts1[i][0] + images[0].width, kpts1[i][1]]);
  }, [kpts0, kpts1, loaded, images[0]?.width]);

  const unmacthed_points = useMemo(() => {
    if (!loaded) return [];
    return [...unmatched_kpts0, ...unmatched_kpts1.map((pt) => [pt[0] + images[0].width, pt[1]])];
  }, [unmatched_kpts0, unmatched_kpts1, loaded, images[0]?.width]);

  const metric = metrics[metricName as string];

  const errorColorFunc = (val: number, i: number) => {
    const clamp = (current: number, min: number, max: number) => {
      return current <= min ? min : current >= max ? max : current;
    }
    
    let x = 1 - clamp(val / (thr as number * 2), 0, 1);
    let r = 255 * (2 - x * 2);
    let g = 255 * (x * 2);
    let b = 0;
    return `rgb(${r},${g},${b})`;
  }
  const colors = useMemo(() => {
    if (metric) {
      if (showMatchesBy == showMatchesOptions[0]) {
        const palette = interpolate(createColormap({ colormap }));
        const min = Math.min(...metric);
        const max = Math.max(...metric);

        const sortedMetric = JSON.parse(JSON.stringify(metric))
        sortedMetric.sort((a, b) => a - b)
        const localMax = sortedMetric[Math.ceil(sortedMetric.length * 0.95) - 1]

        return metric.map(
          (val: number, i: number) => colorFunc(palette, min, max, localMax, val, i) || defaultColorFunc(palette, min, max, val, i)
        );
      }
      else {
        return metric.map((val: number, i: number) => errorColorFunc(val, i));
      }
    }
    return new Array(kpts0.length).fill("#ff00000");
  }, [metric, kpts0.length, colormap, colorFunc, thr]);

  const updateColorFuncBody = useCallback((val: string) => {
    setColorFuncBody(val);
    setHiddenTrue();
    localStorage.setItem("colorFuncBody", JSON.stringify(val));
  }, []);

  const thresholdsSelect = (name: string, i: number, lb: number, ub: number) => {
    if(metrics[name]) {
      return inside(metrics[name][i], lb, ub);
    }
    else return true
  }

  const indices = useMemo(() => {
    if (!loaded) return [];
    return kpts0.reduce<number[]>((indices, _, i) => {
      const cond1 = (showAllMatches || showMatchesBy == showMatchesOptions[1]) ? true : Object.entries(thresholds).every(
        ([name, [lb, ub]]) => thresholdsSelect(name, i, lb, ub)
      );
      const cond2 = Object.entries(filters).every(
        ([name, { enabled, inverted }]) => !enabled || (inverted ? !booleans[name][i] : booleans[name][i])
      );
      cond1 && cond2 && indices.push(i);
      return indices;
    }, []);
  }, [kpts0, metrics, booleans, thresholds, filters, loaded, showAllMatches, showMatchesBy]);

  const lines = useMemo(() => {
    return indices.map((i) => (
      <LineSegment
        key={i}
        index={i}
        points={points[i]}
        lineOpactiy={lineOpacity}
        pointOpacity={pointOpacity}
        stroke={colors[i]}
        strokeWidth={strokeWidth}
        radius={1}
        shadowForStrokeEnabled={false}
      />
    ));
  }, [indices, points, colors, lineOpacity, pointOpacity, strokeWidth]);

  const highlightIndex = hoveredIndex === undefined ? dblClickedIndex : hoveredIndex;
  const linesLayerActive = isStatic && dblClickedIndex === undefined;
  const highlightLayerActive = isStatic;

  return (
    <>
      {hidden || (
        <EditFuncBodyModal
          hidden={hidden}
          text={colorFuncBody}
          onDismiss={setHiddenTrue}
          onSave={updateColorFuncBody}
        />
      )}
      {img0 && <MetaView shown={indices.length} total={kpts0.length} {...meta} />}
      {kpts0[highlightIndex] && (
        <KeypointInfoView
          index={highlightIndex}
          kpt0={kpts0[highlightIndex]}
          kpt1={kpts1[highlightIndex]}
          {...Object.fromEntries(
            metricNames
              .map((name) => [name, metrics[name][highlightIndex]])
              .concat(boolNames.map((name) => [name, booleans[name][highlightIndex]?.toString()]))
          )}
        />
      )}
      <Stage
        draggable
        ref={ref}
        width={width}
        height={height}
        scaleX={scale}
        scaleY={scale}
        onWheel={onWheel}
        onClick={onMouseEnter}
        onDblClick={unselect}
        style={stageStyle}
        onDragStart={onDragStart}
        onDragEnd={onDragEnd}
      >
        <Layer name="imageLayer" listening={false} x={offsetLeft} y={offsetTop}>
          <Image x={0} y={0} image={images[0]} />
          <Image x={images[0]?.width || 0} y={0} image={images[1]} />
          {showUnmatchedKeypoints &&
            unmacthed_points.map(([x, y], i) => (
              <Circle key={i} x={x} y={y} stroke="#ff0000" strokeWidth={strokeWidth} radius={1} />
            ))}
        </Layer>
        <Layer
          name="linesLayer"
          x={offsetLeft}
          y={offsetTop}
          listening={linesLayerActive}
          visible={linesLayerActive}
          onMouseEnter={onMouseEnter}
          onDblClick={onDblClick}
        >
          {lines}
        </Layer>
        <Layer
          name="highlightLayer"
          x={offsetLeft}
          y={offsetTop}
          visible={highlightLayerActive}
          listening={highlightLayerActive}
        >
          {points[dblClickedIndex] ? (
            <LineSegment
              index={dblClickedIndex}
              points={points[dblClickedIndex]}
              stroke={colors[dblClickedIndex]}
              strokeWidth={strokeWidth}
            />
          ) : (
            points[hoveredIndex] && (
              <LineSegment
                index={hoveredIndex}
                points={points[hoveredIndex]}
                stroke={colors[hoveredIndex]}
                shadowBlur={5}
                strokeWidth={strokeWidth}
                onDblClick={onDblClick}
              />
            )
          )}
        </Layer>
      </Stage>
    </>
  );
});

export default Correspondence;
