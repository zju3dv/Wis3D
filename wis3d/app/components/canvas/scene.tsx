import {memo, useRef, useContext, useCallback, useEffect} from "react";
import type {TrackballControls as TrackballControlsImpl} from "three/examples/jsm/controls/TrackballControls";
import type {OrbitControls as OrbitControlsImpl} from "three/examples/jsm/controls/OrbitControls";
import {useThree, RootState} from "@react-three/fiber";
import {FrontSide, BackSide, DoubleSide, Vector3Tuple} from "three";
import {useHotkeys} from "react-hotkeys-hook";
import {button, useControls, LevaInputs} from "leva";
import {ControlsRefContext} from "@/utils/contexts";
import {IObject} from "@/stores/object-store";
import {TrackballControls} from "./trackball-controls";
import {Mesh} from "./mesh";
import PointCloud from "./point-cloud";
import CameraPose from "./camera-pose";
import Boxes from "./boxes";
import Lines from "./lines";
import Voxel from "./voxel";
import Spheres from "./spheres";
import {Schema, StoreType} from "leva/dist/declarations/src/types";
import {theme} from "@/utils/theme";
import {Plane} from "./plane";

const SIDES = {FrontSide, BackSide, DoubleSide};
const meshSchema = {
    material: {
        label: "material",
        hint: "material",
        options: ["MeshBasicMaterial", "MeshStandardMaterial", "MeshNormalMaterial", "MeshPhongMaterial"],
        value: (JSON.parse(localStorage.getItem("mesh.material")) as string) ?? "MeshNormalMaterial"
    },
    vertexColors: {
        label: "vertex colors",
        hint: "vertex colors",
        value: (JSON.parse(localStorage.getItem("mesh.vertexColors")) as boolean) ?? true
    },
    wireframe: {
        hint: "wireframe",

        value: (JSON.parse(localStorage.getItem("mesh.wireframe")) as boolean) ?? false
    },
    flatShading: {
        label: "flat shading",
        hint: "flat shading",
        value: (JSON.parse(localStorage.getItem("mesh.flatShading")) as boolean) ?? false
    },
    shininess: {
        hint: "shininess",
        value: (JSON.parse(localStorage.getItem("mesh.shininess")) as number) ?? 10,
        min: 0,
        max: 100
    },
    side: {
        hint: "side",
        options: Object.keys(SIDES),
        value: (JSON.parse(localStorage.getItem("mesh.side")) as string) ?? "FrontSide"
    }
};

const MeshSet = memo<{ items?: IObject[]; store?: StoreType }>(function MeshSet(props) {
    const {items, store} = props;
    const {
        material,
        vertexColors,
        wireframe,
        flatShading,
        shininess,
        side
    } = useControls("mesh", meshSchema, {store}, []);

    return (
        <>
            {items.map((obj, i) => (
                <Mesh
                    key={i}
                    url={obj.url}
                    color={obj.color}
                    visible={obj.visible}
                    material={material}
                    vertexColors={vertexColors}
                    wireframe={wireframe}
                    shininess={shininess}
                    side={SIDES[side]}
                    flatShading={flatShading}
                />
            ))}
        </>
    );
});

var currentSizeRange = [0.001, 0.01];
const pointCloudSchema = () => {
    const config: Schema = {};
    const sizeRange = JSON.parse(localStorage.getItem("point cloud.pointSizeRange")) ?? [0.001, 0.01];

    config["vertexColors"] = {
        label: "vertex colors",
        hint: "vertex colors",
        value: (JSON.parse(localStorage.getItem("point cloud.vertexColors")) as boolean) ?? true
    },
        config["opacity"] = {
            label: "opacity",
            hint: "opacity",
            value: (JSON.parse(localStorage.getItem("point cloud.opacity")) as number) ?? 1.0,
            min: 0,
            max: 1.0,
            step: 0.01
        }
    config["pointSizeRange"] = {
        label: "point size range",
        hint: "point size range",
        max: 1.5,
        min: 0.001,
        value: [sizeRange[0], sizeRange[1]]
    },
        config["pointSize"] = {
            label: "point size",
            hint: "point size",
            value: (JSON.parse(localStorage.getItem("point cloud.pointSize")) as number) ?? 0.02,
            min: currentSizeRange[0],
            max: currentSizeRange[1],
            step: 0.001
        },
        config["currentSize"] = {
            type: LevaInputs.STRING,
            label: "current size",
            hint: "current size",
            disabled: true,
            value: (JSON.parse(localStorage.getItem("point cloud.pointSize"))?.toFixed(3).toString()) ?? "0.020"
        }
    return config;
};

const PointCloudSet = memo<{ items?: IObject[]; store?: StoreType }>(function PointCloudSet(props) {
    const {items, store} = props;
    const [{vertexColors, opacity, pointSizeRange, pointSize}, set] = useControls(
        "point cloud",
        pointCloudSchema,
        {store},
        [currentSizeRange]
    );

    currentSizeRange = pointSizeRange as any;
    set({
        pointSize: () => {
            var currentSize = pointSize <= pointSizeRange[0] ? pointSizeRange[0] : pointSize >= pointSizeRange[1] ? pointSizeRange[1] : pointSize;
            return currentSize;
        },
        currentSize: (pointSize as number).toFixed(3).toString(),
    })

    return (
        <>
            {items.map((obj, i) => (
                <PointCloud
                    key={i}
                    url={obj.url}
                    color={obj.color}
                    visible={obj.visible}
                    vertexColors={vertexColors as boolean}
                    opacity={opacity as number}
                    pointSize={pointSize as number}
                />
            ))}
        </>
    );
});

const boxSchema = {
    showAxes: {
        value: (JSON.parse(localStorage.getItem("box.showAxes")) as boolean) ?? true,
        label: "show axes",
        hint: "show axes"
    },
    showLabel: {
        value: (JSON.parse(localStorage.getItem("box.showLabel")) as boolean) ?? true,
        label: "show label",
        hint: "show label"
    },
    opacity: {
        label: "opacity",
        hint: "opacity",
        value: (JSON.parse(localStorage.getItem("box.opacity")) as number) ?? 0.5,
        min: 0,
        max: 1.0,
        step: 0.01
    }
};

const BoxSet = memo<{ items?: IObject[]; store?: StoreType }>(function BoxSet(props) {
    const {items, store} = props;
    const {showAxes, showLabel, opacity} = useControls("box", boxSchema, {store}, []);

    return (
        <group>
            {items.map((obj, i) => (
                <Boxes
                    key={i}
                    name={obj.name}
                    url={obj.url}
                    color={obj.color}
                    visible={obj.visible}
                    showAxes={showAxes}
                    showLabel={showLabel}
                    opacity={opacity}
                />
            ))}
        </group>
    );
});

const trajectorySchema = {
    showCamera: {
        value: (JSON.parse(localStorage.getItem("trajectory.showCamera")) as boolean) ?? true,
        label: "show camera",
        hint: "show camera"
    },
    cameraFollow: {
        label: "camera follow",
        hint: "camera follow",
        value: (JSON.parse(localStorage.getItem("trajectory.cameraFollow")) as boolean) ?? false
    },
    pointSize: {
        value: (JSON.parse(localStorage.getItem("trajectory.pointSize")) as number) ?? 0.03,
        min: 0.001,
        max: 0.1,
        step: 0.001,
        label: "point size",
        hint: "point size"
    },
    pointColor: {
        value: (JSON.parse(localStorage.getItem("trajectory.pointColor")) as string) ?? "#e5e5e5",
        label: "point color",
        hint: "point color"
    },
    lineColor: {
        value: (JSON.parse(localStorage.getItem("trajectory.lineColor")) as string) ?? "#1f77b4",
        label: "line color",
        hint: "line color"
    },
    vertexColors: {
        label: "vertex colors",
        hint: "vertex colors",
        value: (JSON.parse(localStorage.getItem("trajectory.vertexColors")) as boolean) ?? true
    },
};

const cameraSelector = (state: RootState) => state.camera;
// const target = new Vector3(0, 0, -0.001);

const CameraPoseSet = memo<{ items?: IObject[]; store?: StoreType }>(function CameraPoseSet(props) {
    const {items, store} = props;
    const camera = useThree(cameraSelector);
    const controlsRef = useContext(ControlsRefContext);
    const {showCamera, lineColor, pointColor, pointSize, cameraFollow, vertexColors} = useControls(
        "trajectory",
        trajectorySchema,
        {store},
        []
    );
    const cameraFollowCb = useRef<() => void>();

    useEffect(() => {
        cameraFollow ? cameraFollowCb.current?.() : controlsRef.current?.reset();
    }, [cameraFollow]);

    const updateCamera = useCallback(
        (pos: Vector3Tuple, euler: Vector3Tuple) => {
            cameraFollowCb.current = () => {
                camera.position.set(...pos);
                camera.rotation.set(...euler);
                // camera.lookAt(camera.localToWorld(target));
                controlsRef.current?.update();
            };

            cameraFollow && cameraFollowCb.current();
        },
        [cameraFollow]
    );

    return (
        <>
            {items.map((obj, i) => (
                <CameraPose
                    key={i}
                    url={obj.url}
                    showCamera={showCamera}
                    visible={obj.visible}
                    lineColor={lineColor}
                    pointSize={pointSize}
                    pointColor={pointColor}
                    defaultColor={obj.color}
                    vertexColors={vertexColors}
                    onLoad={i === 0 ? updateCamera : undefined}
                />
            ))}
        </>
    );
});

const lineSchema = {
    lineWidth: {
        label: "line width",
        hint: "line width",
        value: (JSON.parse(localStorage.getItem("line.lineWidth")) as number) ?? 1,
        min: 1,
        max: 10,
        step: 0.1
    },
    vertexColors: {
        label: "vertex colors",
        hint: "vertex colors",
        value: (JSON.parse(localStorage.getItem("line.vertexColors")) as boolean) ?? true
    }
};

const LineSet = memo<{ items?: IObject[]; store?: StoreType }>(function LineSet(props) {
    const {items, store} = props;
    const {lineWidth, vertexColors} = useControls("line", lineSchema, {store}, []);

    return (
        <group>
            {items.map((obj, i) => (
                <Lines
                    key={i}
                    name={obj.name}
                    url={obj.url}
                    defaultColor={obj.color}
                    visible={obj.visible}
                    lineWidth={lineWidth}
                    vertexColors={vertexColors}
                />
            ))}
        </group>
    );
});

const voxelSchema = {
    vertexColors: {
        label: "vertex colors",
        hint: "vertex colors",
        value: (JSON.parse(localStorage.getItem("voxel.vertexColors")) as boolean) ?? true
    },
};

const VoxelSet = memo<{ items?: IObject[]; store?: StoreType }>(function VoxelSet(props) {
    const {items, store} = props;
    const {vertexColors} = useControls("voxel", voxelSchema, {store}, []);

    return (
        <group>
            {items.map((obj, i) => (
                <Voxel
                    key={i}
                    name={obj.name}
                    url={obj.url}
                    visible={obj.visible}
                    defaultColor={obj.color}
                    vertexColors={vertexColors}
                />
            ))}
        </group>
    );
});

const sphereSchema = {
    material: {
        label: "material",
        hint: "material",
        options: ["MeshBasicMaterial", "MeshNormalMaterial"],
        value: (JSON.parse(localStorage.getItem("sphere.material")) as string) ?? "MeshNormalMaterial"
    },
    sphereColors: {
        label: "sphere colors",
        hint: "sphere colors",
        value: (JSON.parse(localStorage.getItem("sphere.sphereColors")) as boolean) ?? true
    }
}

const SphereSet = memo<{ items?: IObject[]; store?: StoreType }>(function SphereSet(props) {
    const {items, store} = props;
    const {material, sphereColors} = useControls("sphere", sphereSchema, {store}, []);

    return (
        <group>
            {items.map((obj, i) => (
                <Spheres
                    key={i}
                    url={obj.url}
                    defaultColor={obj.color}
                    visible={obj.visible}
                    material={material}
                    sphereColors={sphereColors}
                />
            ))}
        </group>
    )
});

const PlaneSet = memo<{ items?: IObject[]; store?: StoreType }>(function PlaneSet(props) {
    const {items, store} = props;

    return (
        <group>
            {items.map((obj, i) => (
                <Plane key={i} url={obj.url}/>
            ))}
        </group>
    );
});

const glSelector = (state: RootState) => state.gl;

interface ISceneProps {
    meshes?: IObject[];
    pointClouds?: IObject[];
    dofBoxes?: IObject[];
    cameraPoses?: IObject[];
    lines?: IObject[];
    voxels?: IObject[];
    spheres?: IObject[];
    planes?: IObject[];
    store?: StoreType;
}

export const Scene = memo<ISceneProps>(function Scene(props) {
    const {meshes, pointClouds, dofBoxes, cameraPoses, lines, voxels, spheres, planes, store} = props;
    const gl = useThree(glSelector);
    const ref = useRef<OrbitControlsImpl | TrackballControlsImpl>();
    const {worldAxes, background} = useControls(
        {
            worldAxes: {
                label: "world axes",
                hint: "world axes",
                value: true
            },
            background: {
                label: "background",
                hint: "background",
                value: JSON.parse(localStorage.getItem("background")) || theme.palette.white
            },
            "back to initial view (B)": button(() => ref.current?.reset())
        },
        {store},
        []
    );

    useEffect(() => {
        gl.domElement.style.background = background;
    }, [gl, background]);

    useHotkeys("b", () => ref.current?.reset(), []);

    useHotkeys("z", event => {
        if (event.type == "keydown") {
            ref.current.zoomSpeed = 0.2;
        }
        if (event.type == "keyup") {
            ref.current.zoomSpeed = 1.2;
        }
    }, {keydown: true, keyup: true}, [])

    return (
        <>
            <ambientLight intensity={0.5}/>
            <axesHelper visible={worldAxes} args={[10]}/>
            <TrackballControls
                ref={ref}
                staticMoving={true}
                dynamicDampingFactor={0.3}
                rotateSpeed={0.75}
                zoomSpeed={1.2}
                panSpeed={2}
            />
            <ControlsRefContext.Provider value={ref}>
                {meshes && meshes.length != 0 && <MeshSet items={meshes} store={store}/>}
                {pointClouds && pointClouds.length != 0 && <PointCloudSet items={pointClouds} store={store}/>}
                {dofBoxes && dofBoxes.length != 0 && <BoxSet items={dofBoxes} store={store}/>}
                {cameraPoses && cameraPoses.length != 0 && <CameraPoseSet items={cameraPoses} store={store}/>}
                {lines && lines.length != 0 && <LineSet items={lines} store={store}/>}
                {voxels && voxels.length != 0 && <VoxelSet items={voxels} store={store}/>}
                {spheres && spheres.length != 0 && <SphereSet items={spheres} store={store}/>}
                {/* {planes && <PlaneSet items={planes} store={store} />} */}
            </ControlsRefContext.Provider>
        </>
    );
});

export default Scene;
