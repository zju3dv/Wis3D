import {memo, MutableRefObject, useLayoutEffect, useRef} from 'react';
import {useXHR} from "@/utils/hooks";
import {Color, Material, Side} from "three"
import {centerOnDbClick} from "./trackball-controls";

interface IProps {
    url: string;
    material?: string;
    defaultColor?: string;
    visible?: boolean;
    sphereColors?: boolean;
}

function getMaterial(material: string, color: string | number) {
    if (material === "MeshNormalMaterial") {
        return (<meshNormalMaterial transparent={true} opacity={0.8}/>);
    } else if (material === "MeshBasicMaterial") {
        return (<meshBasicMaterial color={color} transparent={true} opacity={0.7}/>);
    }
}


export const Spheres = memo<IProps>(function Spheres(props) {
    const {url, defaultColor, material, visible = true, sphereColors} = props;
    // const {url, defaultColor, visible = true, sphereColors} = props;
    const spheres = useXHR(url, "GET", "json", []);


    return (
        <group visible={visible}>
            {spheres.map((sphere, index) => {
                const {center, radius, color, scales, quaternion} = sphere;
                const userColor = color ? color.map(x => x / 250) : 0xffffff;
                // const materialRef = useRef<Material>();
                // useLayoutEffect(() => {
                //     if (materialRef.current) materialRef.current.needsUpdate = true;
                // }, );


                return (
                    <mesh position={center} quaternion={quaternion} scale={scales} key={index}
                          onDoubleClick={centerOnDbClick}>

                        <sphereBufferGeometry args={[radius, 30, 30]}/>

                        {getMaterial(material, userColor)}

                    </mesh>
                )
            })}
        </group>
    )
})

export default Spheres;