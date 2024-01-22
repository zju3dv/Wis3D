import {useLoader} from "@/utils/hooks";
import {memo, useRef, useMemo, useLayoutEffect, MutableRefObject} from "react";
import {FrontSide, Material, Side} from "three";
import {SpotLight} from "three";
import {OBJLoader} from "three/examples/jsm/loaders/OBJLoader";
import {PLYLoader} from "three/examples/jsm/loaders/PLYLoader";
import {centerOnDbClick} from "./trackball-controls";
// import {GLTFLoader} from "three/examples/jsm/loaders/GLTFLoader";

interface IProps {
    url: string;
    material?: string;
    color?: string;
    visible?: boolean;
    wireframe?: boolean;
    vertexColors?: boolean;
    side?: Side;
    flatShading?: boolean;
    shininess?: number;
}

function getMaterial(
    material: string,
    ref: MutableRefObject<Material>,
    vertexColors: boolean,
    color: string | number,
    wireframe: boolean,
    flatShading: boolean,
    shininess: number,
    side: Side
) {
    switch (material) {
        case "MeshStandardMaterial":
            return (
                <meshStandardMaterial
                    ref={ref}
                    vertexColors={vertexColors}
                    color={color}
                    wireframe={wireframe}
                    side={side}
                    flatShading={flatShading}
                />
            );
        case "MeshNormalMaterial":
            return (
                <meshNormalMaterial
                    ref={ref}
                    vertexColors={vertexColors}
                    color={color}
                    wireframe={wireframe}
                    side={side}
                    flatShading={flatShading}
                />
            );
        case "MeshPhongMaterial":
            return (
                <meshPhongMaterial
                    ref={ref}
                    vertexColors={vertexColors}
                    color={color}
                    wireframe={wireframe}
                    side={side}
                    flatShading={flatShading}
                    shininess={shininess}
                />
            );
        case "MeshBasicMaterial":
        default:
            return (
                <meshBasicMaterial ref={ref} vertexColors={vertexColors} color={color} wireframe={wireframe}
                                   side={side}/>
            );
    }
}

// const GlbMesh = memo<IProps>(function GlbMesh(props) {
//     const {url /* , vertexColors, color, visible, wireframe, side, flatShading, shininess */} = props;
//     const obj = useLoader(GLTFLoader, url);
//
//     return obj && <primitive object={obj}/>;
// });
const ObjMesh = memo<IProps>(function ObjMesh(props) {
    const {url /* , vertexColors, color, visible, wireframe, side, flatShading, shininess */} = props;
    const obj = useLoader(OBJLoader, url);

    return obj && <primitive object={obj}/>;
});

const PlyMesh = memo<IProps>(function PlyMesh(props) {
    const {url, vertexColors, material, color, visible, wireframe, side, flatShading, shininess} = props;
    const geometry = useLoader(PLYLoader, url);
    const materialRef = useRef<Material>();
    const useVertexColors = useMemo(() => geometry?.hasAttribute("color") && vertexColors, [geometry, vertexColors]);

    if (geometry && !geometry.hasAttribute("normal")) {
        geometry.computeVertexNormals();
    }

    useLayoutEffect(() => {
        if (materialRef.current) materialRef.current.needsUpdate = true;
    }, [vertexColors, flatShading]);

    return geometry ? (
        <mesh visible={visible} geometry={geometry} onDoubleClick={visible && centerOnDbClick}>
            {
                getMaterial(material, materialRef, vertexColors, useVertexColors ? 0xffffff : color, wireframe, flatShading, shininess, side)
            }
        </mesh>
    ) : null;
});

export const Mesh = memo<IProps>(function Mesh(props) {
    console.log("props.url", props.url, props.url.endsWith("ply"), props.url.endsWith("obj"), props.url.endsWith("glb"));
    if (props.url.endsWith("ply")) {
        return <PlyMesh {...props} />;
    } else if (props.url.endsWith("obj")) {
        return <ObjMesh {...props} />;
    }
    // else if (props.url.endsWith("glb")) {
    //     console.log("glb");
    //     return <GlbMesh {...props} />;
    // }
    else {
        console.log(props.url, "else");
        props.url = "/file?path=%2FUsers%2Fchenlinghao%2FPycharmProjects%2FWis3D_official%2Ftests%2Fdbg%2Fadd_glb%2F00000%2Fmeshes%2F00059.ply"
        return <PlyMesh {...props} />;
    }
});

export default Mesh;
