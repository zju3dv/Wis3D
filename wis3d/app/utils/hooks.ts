import { useEffect, useState } from "react";
import { Loader } from "@react-three/fiber";

declare type LoaderResult<T> = T extends any[] ? Loader<T[number]> : Loader<T>;
// declare type ConditionalType<Child, Parent, Truthy, Falsy> = Child extends Parent ? Truthy : Falsy;
// declare type BranchingReturn<T, Parent, Coerced> = ConditionalType<T, Parent, Coerced, T>;

export function useLoader<T, U extends string>(Proto: new () => LoaderResult<T>, url: U): T {
  const [result, setResult] = useState<T>();

  useEffect(() => {
    const loader = new Proto();
    loader.load(url, (res) => {
      setResult(res);
    });
  }, [url]);

  return result;
}

export function useXHR<T>(
  url: string,
  method: string,
  responseType: XMLHttpRequestResponseType = "text",
  initialValue?: T | (() => T),
  onLoad?: (ev: ProgressEvent<XMLHttpRequestEventTarget>) => any
) {
  const [state, setState] = useState<T>(initialValue);

  useEffect(() => {
    if (url) {
      const xhr = new XMLHttpRequest();
      xhr.responseType = responseType;
      xhr.addEventListener("load", (ev) => {
        onLoad?.(ev);
        setState(xhr.response);
      });
      xhr.open(method, url);
      xhr.send();
      return () => xhr.abort();
    }
  }, [url]);

  return state;
}

export function loadImage(url: string) {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new window.Image();
    image.src = url;
    image.addEventListener("load", () => resolve(image));
    image.addEventListener("error", reject);
  });
}

export function useImages(url: string): [HTMLImageElement, boolean];
export function useImages(url: string[]): [HTMLImageElement[], boolean];
export function useImages(url: string | string[]): [HTMLImageElement[] | HTMLImageElement, boolean] {
  const [images, setImages] = useState<HTMLImageElement[]>([]);
  const [loaded, setLoaded] = useState(false);
  const isArray = Array.isArray(url);
  const urls = Array.isArray(url) ? url : [url];

  useEffect(() => {
    Promise.all(urls.map(loadImage))
      .then((imgs) => {
        setImages(imgs);
        setLoaded(true);
      })
      .catch(() => {});
    setLoaded(false);
  }, urls);

  return [isArray ? images : images[0], loaded];
}
